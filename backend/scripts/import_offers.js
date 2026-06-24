import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Offer from '../models/Offer.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

// Helper to convert date format DD-MMM-YYYY to YYYY-MM-DD
import { aiParseOffer } from '../utils/offerParser.js';

async function main() {
  console.log("Connecting to Database...");
  let connected = false;
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    console.log("Connected to Atlas DB");
    connected = true;
  } catch (err) {
    console.warn("Atlas failed, attempting Local DB connection...");
    try {
      await mongoose.connect('mongodb://localhost:27017/iaeste_india');
      console.log("Connected to Local DB");
      connected = true;
    } catch (localErr) {
      console.error("Local connection also failed:", localErr.message);
    }
  }

  if (!connected) {
    console.error("Failed to connect to database. Exiting.");
    process.exit(1);
  }

  // Find a default creator (NC_ADMIN user)
  const defaultAdmin = await User.findOne({ role: 'NC_ADMIN' });
  if (!defaultAdmin) {
    console.error("Error: Seeded NC_ADMIN user not found in database.");
    await mongoose.disconnect();
    process.exit(1);
  }
  const creatorId = defaultAdmin._id;

  const offersDir = path.resolve(process.cwd(), 'Offers');
  if (!fs.existsSync(offersDir)) {
    console.error(`Offers directory not found at: ${offersDir}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const files = fs.readdirSync(offersDir);
  const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

  console.log(`Found ${pdfFiles.length} PDF file(s) in Offers directory.`);

  for (const pdfFile of pdfFiles) {
    const pdfPath = path.join(offersDir, pdfFile);
    const baseName = path.basename(pdfFile, path.extname(pdfFile));
    const txtPath = path.join(offersDir, `${baseName}.txt`);

    console.log(`\nProcessing: ${pdfFile}...`);

    // Step 1: Extract Text via Python OCR if not already extracted
    if (!fs.existsSync(txtPath)) {
      console.log(`Running OCR for ${pdfFile}...`);
      try {
        const pythonScript = path.resolve(process.cwd(), 'backend', 'scripts', 'ocr_pdf.py');
        execSync(`python "${pythonScript}" "${pdfPath}" --output "${txtPath}"`, { stdio: 'inherit' });
        console.log(`OCR complete. Text saved to ${txtPath}`);
      } catch (ocrErr) {
        console.error(`Failed to run OCR for ${pdfFile}:`, ocrErr.message);
        continue;
      }
    } else {
      console.log(`OCR text file already exists: ${txtPath}`);
    }

    // Step 2: Read OCR text
    const ocrText = fs.readFileSync(txtPath, 'utf-8');

    // Step 3: Parse details using AI / Regex
    console.log("Extracting information...");
    const parsedData = await aiParseOffer(ocrText);
    console.log("Extracted Information:", JSON.stringify(parsedData, null, 2));

    // Step 4: Save / Update in MongoDB
    try {
      const existingOffer = await Offer.findOne({ offerCode: parsedData.offerCode });
      
      const offerFields = {
        title: parsedData.title,
        offerCode: parsedData.offerCode,
        description: parsedData.description,
        requirements: parsedData.requirements,
        country: parsedData.country,
        duration: parsedData.duration,
        payment: parsedData.payment,
        workType: parsedData.workType || 'ON-SITE',
        lcScope: 'GLOBAL',
        targetLc: null,
        createdBy: creatorId,
        deadline: new Date(parsedData.deadline),
        status: 'RELEASED' // Make it released so members can view it
      };

      if (existingOffer) {
        console.log(`Updating existing offer with code ${parsedData.offerCode}...`);
        await Offer.updateOne({ _id: existingOffer._id }, { $set: offerFields });
        
        // Log update in AuditLog
        const auditLog = new AuditLog({
          action: 'OFFER_CREATION', // Or define a custom action, let's keep it standard
          performedBy: creatorId,
          targetId: existingOffer._id,
          details: `Offer '${parsedData.title}' (${parsedData.offerCode}) updated via OCR script.`
        });
        await auditLog.save();
        console.log(`Successfully updated offer: ${parsedData.offerCode}`);
      } else {
        console.log(`Creating new offer with code ${parsedData.offerCode}...`);
        const newOffer = new Offer(offerFields);
        await newOffer.save();

        // Log creation in AuditLog
        const auditLog = new AuditLog({
          action: 'OFFER_CREATION',
          performedBy: creatorId,
          targetId: newOffer._id,
          details: `Offer '${parsedData.title}' (${parsedData.offerCode}) created via OCR script.`
        });
        await auditLog.save();
        console.log(`Successfully imported offer: ${parsedData.offerCode}`);
      }
    } catch (dbErr) {
      console.error(`Database operations failed for ${parsedData.offerCode}:`, dbErr.message);
    }
  }

  await mongoose.disconnect();
  console.log("\nAll offers processed. DB disconnected.");
}

main();
