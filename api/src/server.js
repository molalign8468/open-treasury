import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { PinataSDK } from "pinata";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import {
  Contract,
  JsonRpcProvider,
  isAddress,
  verifyMessage,
} from "ethers";

dotenv.config();


const app = express();

const reviewerChallenges = new Map();


const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 5,
    fileSize: 10 * 1024 * 1024, // 10 MB per file
  },
});
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const provider = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

const budgetRegistry = new Contract(
  process.env.BUDGET_REGISTRY_ADDRESS,
  [
    "function authorizedMinistries(address) view returns (bool)",
  ],
  provider
);

async function isMinistryAuthorized(address) {
  if (!isAddress(address)) return false;

  return await budgetRegistry.authorizedMinistries(address);
}

function createReviewMessage({
  address,
  reportId,
  status,
  reason,
  nonce,
}) {
  return [
    "OpenTreasury Citizen Report Review",
    `Wallet: ${address.toLowerCase()}`,
    `Report: ${reportId}`,
    `Decision: ${status}`,
    `Reason: ${reason}`,
    `Nonce: ${nonce}`,
    "This signature authorizes this specific review action only.",
  ].join("\n");
}


async function saveReport(report) {
  const { error } = await supabase
    .from("citizen_reports")
    .insert({
      id: report.id,
      spending_id: report.spendingId,
      reporter: report.reporter,
      metadata_cid: report.metadataCID,
      status: report.status ?? "Pending",
      review_reason: report.reviewReason ?? "",
      reward_tx_hash: report.rewardTxHash ?? null,
      created_at: report.createdAt,
    });

  if (error) {
    console.error("Supabase save report error:", error);
    throw error;
  }
}

async function readReports(spendingId) {
  let query = supabase
    .from("citizen_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (spendingId !== undefined) {
    query = query.eq("spending_id", spendingId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase read reports error:", error);
    throw error;
  }

  return data.map((row) => ({
    id: row.id,
    spendingId: Number(row.spending_id),
    reporter: row.reporter,
    metadataCID: row.metadata_cid,
    status: row.status,
    reviewReason: row.review_reason,
    rewardTxHash: row.reward_tx_hash,
    createdAt: row.created_at,
  }));
}



app.use(cors());
app.use(express.json());

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY,
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "OpenTreasury API is running",
  });
});


app.post("/api/evidence", upload.array("files", 5), async (req, res) => {
  try {
    const description = req.body.description?.trim();
    const reportType = req.body.reportType?.trim();
    const isCitizenReport = reportType === "citizen-report";

    // Required for both spending evidence and citizen reports.
    if (!description) {
      return res.status(400).json({
        success: false,
        message: isCitizenReport
          ? "Report description is required."
          : "Spending description is required.",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one evidence file is required.",
      });
    }

    // Additional validation for citizen reports only.
    let spendingId;
    let reporter;

    if (isCitizenReport) {
      spendingId = Number(req.body.spendingId);
      reporter = req.body.reporter?.trim();

      if (!Number.isSafeInteger(spendingId) || spendingId < 1) {
        return res.status(400).json({
          success: false,
          message: "A valid spending record ID is required.",
        });
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(reporter || "")) {
        return res.status(400).json({
          success: false,
          message: "A valid reporter wallet address is required.",
        });
      }
    }

    // Upload every evidence file to Pinata.
    const evidence = [];

    for (const file of req.files) {
      const pinataFile = new File(
        [file.buffer],
        file.originalname,
        { type: file.mimetype }
      );

      const uploadResult = await pinata.upload.public.file(pinataFile);

      evidence.push({
        filename: file.originalname,
        cid: uploadResult.cid,
        type: file.mimetype,
        size: file.size,
      });
    }

    // Keep the existing spending metadata format compatible.
    const metadata = {
      description,
      evidence,
      createdAt: new Date().toISOString(),
      ...(isCitizenReport
        ? {
            reportType: "citizen-report",
            spendingId,
            reporter,
          }
        : {}),
    };

    const metadataResult = await pinata.upload.public.json(metadata);
    
      if (isCitizenReport) {
        await saveReport({
          id: metadataResult.cid,
          spendingId,
          reporter,
          metadataCID: metadataResult.cid,
          status: "Pending",
          reviewReason: "",
          rewardTxHash: null,
          createdAt: metadata.createdAt,
        });
      }


    return res.status(201).json({
      success: true,
      cid: metadataResult.cid,
      metadata,
    });
  } catch (error) {
    console.error("IPFS upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload evidence to IPFS.",
    });
  }
});


app.get("/api/reports", async (req, res) => {
  try {
    let spendingId;

    if (req.query.spendingId !== undefined) {
      spendingId = Number(req.query.spendingId);

      if (
        !Number.isSafeInteger(spendingId) ||
        spendingId < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid spending record ID.",
        });
      }
    }

    const reports = await readReports(spendingId);

    return res.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("Could not load citizen reports:", error);

    return res.status(500).json({
      success: false,
      message: "Could not load citizen reports.",
    });
  }
});


app.get("/api/reviewer/authorization", async (req, res) => {
  try {
    const address = req.query.address;

    if (!address || !isAddress(address)) {
      return res.status(400).json({
        success: false,
        message: "A valid wallet address is required.",
      });
    }

    const authorized = await isMinistryAuthorized(address);

    return res.json({
      success: true,
      authorized,
    });
  } catch (error) {
    console.error("Reviewer authorization error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not verify ministry authorization.",
    });
  }
});

app.post("/api/reviewer/challenge", async (req, res) => {
  try {
    const { address, reportId, status, reason } = req.body;

    if (
      !address ||
      !isAddress(address) ||
      !reportId ||
      !["Approved", "Rejected"].includes(status) ||
      typeof reason !== "string" ||
      reason.trim().length < 5 ||
      reason.trim().length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid review information.",
      });
    }

    const authorized = await isMinistryAuthorized(address);

    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: "Only authorized ministries can review reports.",
      });
    }

    const nonce = randomBytes(24).toString("hex");
    const normalizedReason = reason.trim();

    const message = createReviewMessage({
      address,
      reportId,
      status,
      reason: normalizedReason,
      nonce,
    });

    reviewerChallenges.set(nonce, {
      address: address.toLowerCase(),
      reportId: String(reportId),
      status,
      reason: normalizedReason,
      message,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return res.json({
      success: true,
      nonce,
      message,
    });
  } catch (error) {
    console.error("Review challenge error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not create the review challenge.",
    });
  }
});

app.post("/api/reports/:id/review", async (req, res) => {
  try {
    const { address, status, reason, nonce, signature } = req.body;
    const reportId = req.params.id;

    if (
      !address ||
      !isAddress(address) ||
      !["Approved", "Rejected"].includes(status) ||
      typeof reason !== "string" ||
      reason.trim().length < 5 ||
      reason.trim().length > 2000 ||
      typeof nonce !== "string" ||
      typeof signature !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid review request.",
      });
    }

    const challenge = reviewerChallenges.get(nonce);

    if (!challenge || challenge.expiresAt < Date.now()) {
      reviewerChallenges.delete(nonce);

      return res.status(401).json({
        success: false,
        message: "Review challenge is missing or expired. Try again.",
      });
    }

    const matches =
      challenge.address === address.toLowerCase() &&
      challenge.reportId === String(reportId) &&
      challenge.status === status &&
      challenge.reason === reason.trim();

    if (!matches) {
      return res.status(401).json({
        success: false,
        message: "The signature challenge does not match this review.",
      });
    }

    const recoveredAddress = verifyMessage(
      challenge.message,
      signature
    );

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: "Invalid wallet signature.",
      });
    }

    if (!(await isMinistryAuthorized(recoveredAddress))) {
      return res.status(403).json({
        success: false,
        message: "This wallet is not an authorized ministry.",
      });
    }

    // Prevent reuse of the same signed challenge.
    reviewerChallenges.delete(nonce);

    const { data: existingReport, error: readError } =
      await supabase
        .from("citizen_reports")
        .select("id, status")
        .eq("id", reportId)
        .maybeSingle();

    if (readError) throw readError;

    if (!existingReport) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    if (existingReport.status !== "Pending") {
      return res.status(409).json({
        success: false,
        message: "This report has already been reviewed.",
      });
    }

    const { data, error } = await supabase
      .from("citizen_reports")
      .update({
        status,
        review_reason: reason.trim(),
      })
      .eq("id", reportId)
      .eq("status", "Pending")
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(409).json({
        success: false,
        message: "The report was already reviewed.",
      });
    }

    return res.json({
      success: true,
      report: {
        id: data.id,
        spendingId: Number(data.spending_id),
        reporter: data.reporter,
        metadataCID: data.metadata_cid,
        status: data.status,
        reviewReason: data.review_reason,
        rewardTxHash: data.reward_tx_hash,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error("Review report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to review the report.",
    });
  }
});




const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`OpenTreasury API running on http://localhost:${PORT}`);
});