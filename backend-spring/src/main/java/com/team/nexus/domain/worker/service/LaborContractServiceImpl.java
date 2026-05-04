package com.team.nexus.domain.worker.service;

import com.itextpdf.forms.PdfAcroForm;
import com.itextpdf.forms.fields.PdfFormField;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.team.nexus.domain.worker.dto.LaborContractRequestDto;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

@Service
public class LaborContractServiceImpl implements LaborContractService {

    private String getTemplatePath(String contractType) {
        return switch (contractType) {
            case "NO_PERIOD"    -> "/templates/pdf/표준근로계약서_기간없음.pdf";
            case "PERIOD"       -> "/templates/pdf/표준근로계약서_기간있음.pdf";
            case "MINOR"        -> "/templates/pdf/표준근로계약서_연소근로자.pdf";
            case "PART_TIME"    -> "/templates/pdf/표준근로계약서_단시간.pdf";
            case "CONSTRUCTION" -> "/templates/pdf/표준근로계약서_건설일용.pdf";
            default -> throw new IllegalArgumentException("잘못된 계약서 유형: " + contractType);
        };
    }

    @Override
    public byte[] generateContract(LaborContractRequestDto r) throws Exception {
        String templatePath = getTemplatePath(r.getContractType());
        InputStream templateStream = getClass().getResourceAsStream(templatePath);

        if (templateStream == null) {
            throw new IllegalArgumentException("PDF 템플릿을 찾을 수 없습니다: " + templatePath);
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfDocument pdfDoc = new PdfDocument(new PdfReader(templateStream), new PdfWriter(out));
        PdfAcroForm form = PdfAcroForm.getAcroForm(pdfDoc, true);

        // ── 공통 필드 ──────────────────────────────────────
        setField(form, "employerName",       r.getEmployerName());
        setField(form, "workerName",         r.getWorkerName());
        setField(form, "workplace",          r.getWorkplace());
        setField(form, "jobDescription",     r.getJobDescription());
        setField(form, "workStartTime",      formatTime(r.getWorkStartTime()));
        setField(form, "workEndTime",        formatTime(r.getWorkEndTime()));
        setField(form, "breakStartTime",     formatTime(r.getBreakStartTime()));
        setField(form, "breakEndTime",       formatTime(r.getBreakEndTime()));
        setField(form, "weeklyWorkDays",     r.getWeeklyWorkDays());
        setField(form, "weeklyHoliday",      r.getWeeklyHoliday());
        setField(form, "wageType",           r.getWageType());
        setField(form, "wage",               r.getWage());
        setField(form, "bonusAmount",        r.getBonusAmount());
        setField(form, "paymentDay",         r.getPaymentDay());
        setField(form, "paymentMethod",      r.getPaymentMethod());
        setField(form, "startDate",          formatDate(r.getStartDate()));
        setField(form, "contractDate",       formatDate(r.getContractDate()));
        setField(form, "employerPhone",      r.getEmployerPhone());
        setField(form, "employerAddress",    r.getEmployerAddress());
        setField(form, "representativeName", r.getRepresentativeName());
        setField(form, "workerAddress",      r.getWorkerAddress());
        setField(form, "workerPhone",        r.getWorkerPhone());

        // ── 서식별 추가 필드 ────────────────────────────────
        switch (r.getContractType()) {
            case "PERIOD" -> {
                setField(form, "endDate", formatDate(r.getEndDate()));
            }
            case "CONSTRUCTION" -> {
                setField(form, "endDate",          formatDate(r.getEndDate()));
                setField(form, "dailyWorkHours",   r.getDailyWorkHours());
                setField(form, "weeklyWorkHours",  r.getWeeklyWorkHours());
            }
            case "MINOR" -> {
                setField(form, "familyCertStatus",    "제출");
                setField(form, "parentConsentStatus", "구비");
            }
        }

        // ── flatten: 필드를 일반 텍스트로 굳혀서 편집 불가 ──
        form.flattenFields();

        pdfDoc.close();
        return out.toByteArray();
    }

    // ── 헬퍼 ────────────────────────────────────────────────

    /** 필드가 없으면 조용히 건너뜀 */
    private void setField(PdfAcroForm form, String name, String value) {
        if (value == null || value.isBlank()) return;
        PdfFormField field = form.getField(name);
        if (field != null) field.setValue(value);
    }

    /** "2026-05-07" → "2026년 05월 07일" */
    private String formatDate(String value) {
        if (value == null || value.isBlank()) return "";
        if (value.matches("\\d{4}-\\d{2}-\\d{2}")) {
            String[] p = value.split("-");
            return p[0] + "년 " + p[1] + "월 " + p[2] + "일";
        }
        return value;
    }

    /** "09:00" → "09시 00분" */
    private String formatTime(String value) {
        if (value == null || value.isBlank()) return "";
        if (value.matches("\\d{2}:\\d{2}")) {
            String[] p = value.split(":");
            return p[0] + "시 " + p[1] + "분";
        }
        return value;
    }
}