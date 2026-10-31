package com.smartpatient.report.service;

import com.smartpatient.report.dto.ReportValueDto;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service to automatically parse and extract structured laboratory test parameters
 * from digital PDF medical reports and text descriptions.
 */
@Service
public class LabReportExtractorService {

    private static final Logger log = LoggerFactory.getLogger(LabReportExtractorService.class);

    // Well-known laboratory test dictionary with standardized test name, canonical key, default unit, and standard reference ranges
    public record KnownBiomarker(String displayName, String canonicalKey, String defaultUnit,
                                 BigDecimal defaultMin, BigDecimal defaultMax, List<Pattern> patterns) {}

    private final List<KnownBiomarker> knownBiomarkers = new ArrayList<>();

    public LabReportExtractorService() {
        initBiomarkerDictionary();
    }

    private void initBiomarkerDictionary() {
        // --- Lipid Panel ---
        knownBiomarkers.add(new KnownBiomarker(
                "Total Cholesterol", "TOTAL_CHOLESTEROL", "mg/dL",
                new BigDecimal("125.0"), new BigDecimal("200.0"),
                List.of(
                        Pattern.compile("(?i)(?:total\\s+cholesterol|serum\\s+cholesterol|cholesterol[\\s,]+total)[^0-9\\n\\r]{0,30}?([0-9]+(?:\\.[0-9]+)?)\\s*(mg/dL|mmol/L)?", Pattern.CASE_INSENSITIVE),
                        Pattern.compile("(?i)\\bcholesterol\\b[^0-9\\n\\r]{0,20}?([0-9]{2,3}(?:\\.[0-9]+)?)\\s*(mg/dL|mmol/L)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "HDL Cholesterol", "HDL_CHOLESTEROL", "mg/dL",
                new BigDecimal("40.0"), new BigDecimal("60.0"),
                List.of(
                        Pattern.compile("(?i)(?:hdl[\\s\\-_]?cholesterol|high[\\s\\-_]density[\\s\\-_]lipoprotein|hdl)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(mg/dL|mmol/L)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "LDL Cholesterol", "LDL_CHOLESTEROL", "mg/dL",
                new BigDecimal("0.0"), new BigDecimal("100.0"),
                List.of(
                        Pattern.compile("(?i)(?:ldl[\\s\\-_]?cholesterol|low[\\s\\-_]density[\\s\\-_]lipoprotein|ldl)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(mg/dL|mmol/L)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "Triglycerides", "TRIGLYCERIDES", "mg/dL",
                new BigDecimal("0.0"), new BigDecimal("150.0"),
                List.of(
                        Pattern.compile("(?i)(?:triglycerides|serum\\s+triglycerides|tg)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(mg/dL|mmol/L)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "VLDL Cholesterol", "VLDL_CHOLESTEROL", "mg/dL",
                new BigDecimal("5.0"), new BigDecimal("30.0"),
                List.of(
                        Pattern.compile("(?i)(?:vldl[\\s\\-_]?cholesterol|very[\\s\\-_]low[\\s\\-_]density|vldl)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(mg/dL|mmol/L)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        // --- Glycemic / Diabetes Panel ---
        knownBiomarkers.add(new KnownBiomarker(
                "Fasting Blood Sugar", "FASTING_BLOOD_SUGAR", "mg/dL",
                new BigDecimal("70.0"), new BigDecimal("99.0"),
                List.of(
                        Pattern.compile("(?i)(?:fasting\\s+blood\\s+sugar|fasting\\s+blood\\s+glucose|fasting\\s+plasma\\s+glucose|fbs|fbg)[^0-9\\n\\r]{0,30}?([0-9]+(?:\\.[0-9]+)?)\\s*(mg/dL|mmol/L)?", Pattern.CASE_INSENSITIVE),
                        Pattern.compile("(?i)(?:blood\\s+glucose[\\s,]+fasting|glucose[\\s,]+fasting)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(mg/dL|mmol/L)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "Postprandial Blood Sugar", "PPBS", "mg/dL",
                new BigDecimal("70.0"), new BigDecimal("140.0"),
                List.of(
                        Pattern.compile("(?i)(?:postprandial\\s+blood\\s+sugar|post\\s+prandial\\s+glucose|ppbs|ppbg)[^0-9\\n\\r]{0,30}?([0-9]+(?:\\.[0-9]+)?)\\s*(mg/dL|mmol/L)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "HbA1c", "HBA1C", "%",
                new BigDecimal("4.0"), new BigDecimal("5.6"),
                List.of(
                        Pattern.compile("(?i)(?:glycated\\s+hemoglobin|glycosylated\\s+hemoglobin|hba1c|a1c)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(%|percent)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        // --- Complete Blood Count (CBC) ---
        knownBiomarkers.add(new KnownBiomarker(
                "Hemoglobin", "HEMOGLOBIN", "g/dL",
                new BigDecimal("13.0"), new BigDecimal("17.0"),
                List.of(
                        Pattern.compile("(?i)\\b(?:hemoglobin|haemoglobin|hb)\\b[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(g/dL|g/L|gm/dL)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "Total WBC Count", "WBC", "/uL",
                new BigDecimal("4000.0"), new BigDecimal("11000.0"),
                List.of(
                        Pattern.compile("(?i)(?:total\\s+wbc|total\\s+leukocyte\\s+count|white\\s+blood\\s+cells|wbc|tlc)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(/uL|/cumm|cumm|cells/cumm|10\\^3/uL)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "Platelet Count", "PLATELETS", "/uL",
                new BigDecimal("150000.0"), new BigDecimal("450000.0"),
                List.of(
                        Pattern.compile("(?i)(?:platelet\\s+count|platelets|plt)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(/uL|/cumm|cumm|lakhs/cumm|10\\^3/uL)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "RBC Count", "RBC", "10^6/uL",
                new BigDecimal("4.5"), new BigDecimal("5.5"),
                List.of(
                        Pattern.compile("(?i)(?:red\\s+blood\\s+cells|rbc\\s+count|rbc)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(10\\^6/uL|mill/cumm|M/uL)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "ESR", "ESR", "mm/hr",
                new BigDecimal("0.0"), new BigDecimal("20.0"),
                List.of(
                        Pattern.compile("(?i)(?:erythrocyte\\s+sedimentation\\s+rate|esr)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(mm/hr|mm)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        // --- Renal Function (RFT) ---
        knownBiomarkers.add(new KnownBiomarker(
                "Serum Creatinine", "CREATININE", "mg/dL",
                new BigDecimal("0.6"), new BigDecimal("1.2"),
                List.of(
                        Pattern.compile("(?i)(?:serum\\s+creatinine|creatinine)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(mg/dL|umol/L)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "Blood Urea Nitrogen", "BUN", "mg/dL",
                new BigDecimal("7.0"), new BigDecimal("20.0"),
                List.of(
                        Pattern.compile("(?i)(?:blood\\s+urea\\s+nitrogen|bun)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(mg/dL)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "Serum Urea", "UREA", "mg/dL",
                new BigDecimal("15.0"), new BigDecimal("40.0"),
                List.of(
                        Pattern.compile("(?i)(?:serum\\s+urea|urea)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(mg/dL)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "Uric Acid", "URIC_ACID", "mg/dL",
                new BigDecimal("3.5"), new BigDecimal("7.2"),
                List.of(
                        Pattern.compile("(?i)(?:serum\\s+uric\\s+acid|uric\\s+acid)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(mg/dL)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        // --- Liver Function (LFT) ---
        knownBiomarkers.add(new KnownBiomarker(
                "Total Bilirubin", "BILIRUBIN_TOTAL", "mg/dL",
                new BigDecimal("0.2"), new BigDecimal("1.2"),
                List.of(
                        Pattern.compile("(?i)(?:bilirubin[\\s,]+total|total\\s+bilirubin)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(mg/dL)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "Direct Bilirubin", "BILIRUBIN_DIRECT", "mg/dL",
                new BigDecimal("0.0"), new BigDecimal("0.3"),
                List.of(
                        Pattern.compile("(?i)(?:bilirubin[\\s,]+direct|direct\\s+bilirubin)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(mg/dL)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "SGOT / AST", "SGOT_AST", "U/L",
                new BigDecimal("10.0"), new BigDecimal("40.0"),
                List.of(
                        Pattern.compile("(?i)(?:aspartate\\s+aminotransferase|sgot[\\s\\/]?ast|sgot|ast)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(U/L|IU/L)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "SGPT / ALT", "SGPT_ALT", "U/L",
                new BigDecimal("10.0"), new BigDecimal("45.0"),
                List.of(
                        Pattern.compile("(?i)(?:alanine\\s+aminotransferase|sgpt[\\s\\/]?alt|sgpt|alt)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(U/L|IU/L)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "Alkaline Phosphatase", "ALP", "U/L",
                new BigDecimal("40.0"), new BigDecimal("129.0"),
                List.of(
                        Pattern.compile("(?i)(?:alkaline\\s+phosphatase|alp)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(U/L|IU/L)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        // --- Thyroid ---
        knownBiomarkers.add(new KnownBiomarker(
                "TSH", "TSH", "uIU/mL",
                new BigDecimal("0.4"), new BigDecimal("4.2"),
                List.of(
                        Pattern.compile("(?i)(?:thyroid\\s+stimulating\\s+hormone|tsh|ultra\\s+tsh)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(uIU/mL|mIU/L|uIU/ml|mIU/ml)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "Free T3", "FREE_T3", "pg/mL",
                new BigDecimal("2.3"), new BigDecimal("4.2"),
                List.of(
                        Pattern.compile("(?i)(?:free\\s+triiodothyronine|free\\s+t3|ft3)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(pg/mL|pmol/L)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "Free T4", "FREE_T4", "ng/dL",
                new BigDecimal("0.8"), new BigDecimal("1.8"),
                List.of(
                        Pattern.compile("(?i)(?:free\\s+thyroxine|free\\s+t4|ft4)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(ng/dL|pmol/L)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        // --- Electrolytes & Vitamins ---
        knownBiomarkers.add(new KnownBiomarker(
                "Serum Sodium", "SODIUM", "mEq/L",
                new BigDecimal("135.0"), new BigDecimal("145.0"),
                List.of(
                        Pattern.compile("(?i)(?:serum\\s+sodium|sodium|na\\+?)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(mEq/L|mmol/L)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "Serum Potassium", "POTASSIUM", "mEq/L",
                new BigDecimal("3.5"), new BigDecimal("5.1"),
                List.of(
                        Pattern.compile("(?i)(?:serum\\s+potassium|potassium|k\\+?)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(mEq/L|mmol/L)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "Vitamin D (25-OH)", "VITAMIN_D", "ng/mL",
                new BigDecimal("30.0"), new BigDecimal("100.0"),
                List.of(
                        Pattern.compile("(?i)(?:25[\\s\\-_]?oh[\\s\\-_]?vitamin\\s+d|vitamin\\s+d3?)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(ng/mL|nmol/L)?", Pattern.CASE_INSENSITIVE)
                )
        ));

        knownBiomarkers.add(new KnownBiomarker(
                "Vitamin B12", "VITAMIN_B12", "pg/mL",
                new BigDecimal("200.0"), new BigDecimal("900.0"),
                List.of(
                        Pattern.compile("(?i)(?:vitamin\\s+b12|cobalamin)[^0-9\\n\\r]{0,25}?([0-9]+(?:\\.[0-9]+)?)\\s*(pg/mL|pmol/L)?", Pattern.CASE_INSENSITIVE)
                )
        ));
    }

    /**
     * Extracts plain text from an uploaded PDF file using Apache PDFBox.
     */
    public String extractTextFromPdf(byte[] pdfBytes) {
        if (pdfBytes == null || pdfBytes.length == 0) {
            return "";
        }
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String text = stripper.getText(document);
            return text != null ? text : "";
        } catch (Exception ex) {
            log.warn("Failed to extract digital text from PDF (document may be scanned or image-based): {}", ex.getMessage());
            return "";
        }
    }

    /**
     * Extracts text from an input stream.
     */
    public String extractTextFromPdf(InputStream inputStream) {
        try {
            byte[] bytes = inputStream.readAllBytes();
            return extractTextFromPdf(bytes);
        } catch (Exception ex) {
            log.warn("Failed to read PDF stream: {}", ex.getMessage());
            return "";
        }
    }

    /**
     * Parses raw extracted text and optional user description to extract structured laboratory test metrics.
     */
    public List<ReportValueDto> parseLabValues(String text) {
        List<ReportValueDto> extracted = new ArrayList<>();
        if (text == null || text.trim().isEmpty()) {
            return extracted;
        }

        Map<String, ReportValueDto> matchedMap = new LinkedHashMap<>();

        // 1. Scan lines for known biomarkers
        String[] lines = text.split("\\r?\\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;

            for (KnownBiomarker kb : knownBiomarkers) {
                if (matchedMap.containsKey(kb.canonicalKey())) {
                    continue; // Already found in earlier line
                }

                for (Pattern p : kb.patterns()) {
                    Matcher m = p.matcher(trimmed);
                    if (m.find()) {
                        String numStr = m.group(1);
                        String unitStr = m.groupCount() >= 2 ? m.group(2) : null;
                        if (numStr != null && !numStr.isEmpty()) {
                            try {
                                BigDecimal val = new BigDecimal(numStr);
                                String unit = (unitStr != null && !unitStr.trim().isEmpty()) ? unitStr.trim() : kb.defaultUnit();

                                // Look for reference ranges on the same line (e.g. 125 - 200 or < 100)
                                BigDecimal min = kb.defaultMin();
                                BigDecimal max = kb.defaultMax();

                                Pattern rangePattern = Pattern.compile("([0-9]+(?:\\.[0-9]+)?)\\s*(?:-|to|–)\\s*([0-9]+(?:\\.[0-9]+)?)");
                                Matcher rm = rangePattern.matcher(trimmed);
                                if (rm.find()) {
                                    try {
                                        BigDecimal parsedMin = new BigDecimal(rm.group(1));
                                        BigDecimal parsedMax = new BigDecimal(rm.group(2));
                                        // Ensure range wasn't the test value itself
                                        if (parsedMin.compareTo(parsedMax) <= 0) {
                                            min = parsedMin;
                                            max = parsedMax;
                                        }
                                    } catch (Exception ignored) {}
                                } else {
                                    Pattern lessThanPattern = Pattern.compile("<\\s*([0-9]+(?:\\.[0-9]+)?)");
                                    Matcher ltm = lessThanPattern.matcher(trimmed);
                                    if (ltm.find()) {
                                        try {
                                            max = new BigDecimal(ltm.group(1));
                                        } catch (Exception ignored) {}
                                    }
                                }

                                String interp = "NORMAL";
                                if (min != null && val.compareTo(min) < 0) {
                                    interp = "LOW";
                                } else if (max != null && val.compareTo(max) > 0) {
                                    interp = "HIGH";
                                }

                                ReportValueDto dto = new ReportValueDto();
                                dto.setTestName(kb.displayName());
                                dto.setNormalizedTestKey(kb.canonicalKey());
                                dto.setNumericValue(val.setScale(2, RoundingMode.HALF_UP));
                                dto.setUnit(unit);
                                dto.setReferenceRangeMin(min != null ? min.setScale(2, RoundingMode.HALF_UP) : null);
                                dto.setReferenceRangeMax(max != null ? max.setScale(2, RoundingMode.HALF_UP) : null);
                                dto.setInterpretation(interp);

                                matchedMap.put(kb.canonicalKey(), dto);
                                break;
                            } catch (Exception ex) {
                                log.debug("Could not parse number from line: {}", trimmed);
                            }
                        }
                    }
                }
            }
        }

        // 2. Generic fallback parser for standard tabular lines: [Test Name] [Value] [Unit] [Min - Max]
        // E.g.: "Serum Lipase 45 U/L 10 - 60"
        Pattern genericPattern = Pattern.compile("^([A-Za-z][A-Za-z0-9\\s\\(\\)]{3,40}?)\\s+([0-9]+(?:\\.[0-9]+)?)\\s+([a-zA-Z%/]+(?:/[a-zA-Z]+)?)\\s*(?:(?:([0-9]+(?:\\.[0-9]+)?)\\s*(?:-|to|–)\\s*([0-9]+(?:\\.[0-9]+)?))|.*)?$");
        for (String line : lines) {
            String trimmed = line.trim();
            Matcher gm = genericPattern.matcher(trimmed);
            if (gm.matches()) {
                String testName = gm.group(1).trim();
                String key = testName.toUpperCase().replaceAll("[^A-Z0-9]+", "_");
                if (!matchedMap.containsKey(key) && key.length() >= 3) {
                    try {
                        BigDecimal val = new BigDecimal(gm.group(2));
                        String unit = gm.group(3).trim();
                        BigDecimal min = gm.group(4) != null ? new BigDecimal(gm.group(4)) : null;
                        BigDecimal max = gm.group(5) != null ? new BigDecimal(gm.group(5)) : null;

                        String interp = "NORMAL";
                        if (min != null && val.compareTo(min) < 0) {
                            interp = "LOW";
                        } else if (max != null && val.compareTo(max) > 0) {
                            interp = "HIGH";
                        }

                        ReportValueDto dto = new ReportValueDto();
                        dto.setTestName(testName);
                        dto.setNormalizedTestKey(key);
                        dto.setNumericValue(val.setScale(2, RoundingMode.HALF_UP));
                        dto.setUnit(unit);
                        dto.setReferenceRangeMin(min != null ? min.setScale(2, RoundingMode.HALF_UP) : null);
                        dto.setReferenceRangeMax(max != null ? max.setScale(2, RoundingMode.HALF_UP) : null);
                        dto.setInterpretation(interp);

                        matchedMap.put(key, dto);
                    } catch (Exception ignored) {}
                }
            }
        }

        extracted.addAll(matchedMap.values());
        return extracted;
    }

    /**
     * Extracts structured values from file bytes or description.
     */
    public List<ReportValueDto> extractValues(byte[] fileBytes, String filename, String description) {
        StringBuilder combinedText = new StringBuilder();
        if (description != null && !description.trim().isEmpty()) {
            combinedText.append(description).append("\n");
        }

        if (filename != null && filename.toLowerCase().endsWith(".pdf") && fileBytes != null && fileBytes.length > 0) {
            String pdfText = extractTextFromPdf(fileBytes);
            if (pdfText != null && !pdfText.isEmpty()) {
                combinedText.append(pdfText).append("\n");
            }
        }

        return parseLabValues(combinedText.toString());
    }
}
