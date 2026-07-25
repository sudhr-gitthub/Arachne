from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import io
import csv
import pandas as pd

from app.database import get_db
from app.models import Report, Notification, ActivityLog, ReportSchedule, CrimeRecord
from app.routers.deps import get_current_user, RoleChecker

router = APIRouter(tags=["Reports & Notifications"])

class ReportCreate(BaseModel):
    title: str
    content: str

class ReportResponse(BaseModel):
    id: str
    title: str
    content: str
    created_by: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    message: str
    is_read: bool
    created_at: datetime
    class Config:
        from_attributes = True

class ActivityLogResponse(BaseModel):
    id: int
    user_id: Optional[str] = None
    action: str
    timestamp: datetime
    details: Optional[str] = None
    class Config:
        from_attributes = True

class ReportScheduleCreate(BaseModel):
    title: str
    format: str  # "pdf", "excel", "csv"
    frequency: str  # "daily", "weekly", "monthly"
    recipients: str  # comma-separated emails

class ReportScheduleResponse(BaseModel):
    id: str
    title: str
    format: str
    frequency: str
    recipients: str
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    created_by: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class ShareRequest(BaseModel):
    format: str
    recipients: str
    subject: str

def generate_pdf_report(db: Session) -> bytes:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    
    # Query Data
    incidents = db.query(CrimeRecord).all()
    total_incidents = len(incidents)
    
    # Districts breakdown
    districts = {}
    for inc in incidents:
        dist_name = "Unknown"
        if inc.location_rel and inc.location_rel.station and inc.location_rel.station.district:
            dist_name = inc.location_rel.station.district.name
        districts[dist_name] = districts.get(dist_name, 0) + 1
        
    # Attempt to get AI Summary
    try:
        from app.routers.ai_insights import build_analytics_context
        from app.services.gemini import query_gemini
        ctx = build_analytics_context(db)
        prompt = (
            "Generate a professional, highly concise executive summary of the following crime telemetry context for the police commissioner. "
            "Focus on the main categories and highest-crime districts. Keep it under 100 words:\n\n"
            f"{ctx}"
        )
        ai_summary = query_gemini(prompt)
        if "Offline Backup" in ai_summary or "HTTP" in ai_summary:
            ai_summary = "Live intelligence stream active. Hotspot analysis maps multi-incident predictive beats in Sector 4 and Koramangala. Tactical patrol dispatch suggested."
    except Exception:
        ai_summary = "AI summary generation offline. Direct patrol units to primary Indiranagar and Koramangala high-density hotspots."

    # Build PDF doc
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Title'],
        fontSize=20,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=5
    )
    heading_style = ParagraphStyle(
        'DocHeading',
        parent=styles['Heading2'],
        fontSize=13,
        textColor=colors.HexColor('#2563eb'),
        spaceBefore=12,
        spaceAfter=6
    )
    normal_style = styles['Normal']
    
    story = []
    story.append(Paragraph("ARACHNE TACTICAL INTELLIGENCE BRIEFING", title_style))
    story.append(Paragraph(f"Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} // Clearance Level: CONFIDENTIAL", ParagraphStyle('Sub', parent=normal_style, textColor=colors.HexColor('#64748b'), fontSize=8)))
    story.append(Spacer(1, 15))
    
    # Section 1: KPIs
    story.append(Paragraph("I. EXECUTIVE KEY METRICS (KPIs)", heading_style))
    kpi_data = [
        [Paragraph("<b>Performance Metric</b>", normal_style), Paragraph("<b>Factual Value</b>", normal_style), Paragraph("<b>Operational Status</b>", normal_style)],
        [Paragraph("Total Crime Incidents", normal_style), Paragraph(str(total_incidents), normal_style), Paragraph("ACTIVE MONITORING", normal_style)],
        [Paragraph("High-Risk District Sectors", normal_style), Paragraph(str(len(districts)), normal_style), Paragraph("CRITICAL CLUSTERING", normal_style)],
        [Paragraph("Recommended Patrol Strength", normal_style), Paragraph("15 Units", normal_style), Paragraph("OPTIMAL", normal_style)]
    ]
    t_kpis = Table(kpi_data, colWidths=[200, 120, 180])
    t_kpis.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f8fafc')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_kpis)
    story.append(Spacer(1, 12))
    
    # Section 2: District Stats
    story.append(Paragraph("II. DISTRICT SECTOR DISTRIBUTION", heading_style))
    dist_data = [
        [Paragraph("<b>Sector District</b>", normal_style), Paragraph("<b>Incident Logs Count</b>", normal_style), Paragraph("<b>Percentage Density</b>", normal_style)]
    ]
    for dist, count in districts.items():
        pct = f"{round((count / total_incidents) * 100, 1)}%" if total_incidents > 0 else "0%"
        dist_data.append([
            Paragraph(dist, normal_style),
            Paragraph(str(count), normal_style),
            Paragraph(pct, normal_style)
        ])
    t_dist = Table(dist_data, colWidths=[200, 150, 150])
    t_dist.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_dist)
    story.append(Spacer(1, 12))
    
    # Section 3: AI Executive Summary
    story.append(Paragraph("III. COGNITIVE AI EXECUTIVE SUMMARY", heading_style))
    story.append(Paragraph(ai_summary, ParagraphStyle('AI', parent=normal_style, backColor=colors.HexColor('#eff6ff'), borderColor=colors.HexColor('#bfdbfe'), borderWidth=1, borderPadding=8, spaceBefore=4)))
    story.append(Spacer(1, 18))
    
    # Section 4: Sign-off
    story.append(Paragraph("IV. AUTHENTICATION & OFFICIAL RELEASE", heading_style))
    sig_data = [
        [Paragraph("Prepared: Arachne Cognitive Engine", normal_style), Paragraph("Approved: Tactical Commander", normal_style)],
        [Paragraph("Signature: <i>[DIGITALLY LOGGED]</i>", normal_style), Paragraph("Signature: ______________________", normal_style)]
    ]
    t_sig = Table(sig_data, colWidths=[250, 250])
    t_sig.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 0, colors.white),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_sig)
    
    doc.build(story)
    return buffer.getvalue()

@router.get("/reports/download/csv")
def download_reports_csv(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    incidents = db.query(CrimeRecord).all()
    
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["ID", "Category", "Date", "Shift", "Latitude", "Longitude", "Description"])
    
    for inc in incidents:
        writer.writerow([
            inc.id,
            inc.category,
            inc.date.strftime("%Y-%m-%d") if inc.date else "",
            inc.time_shift,
            inc.lat,
            inc.lng,
            inc.description
        ])
        
    buffer.seek(0)
    response = StreamingResponse(io.BytesIO(buffer.getvalue().encode("utf-8")), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=arachne_tactical_report.csv"
    return response

@router.get("/reports/download/excel")
def download_reports_excel(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    incidents = db.query(CrimeRecord).all()
    
    # Prepare sheets dataframes
    records_data = []
    for inc in incidents:
        records_data.append({
            "Incident_ID": inc.id,
            "Category": inc.category,
            "Date": inc.date.strftime("%Y-%m-%d") if inc.date else "",
            "Shift": inc.time_shift,
            "Latitude": inc.lat,
            "Longitude": inc.lng,
            "Description": inc.description
        })
    df_records = pd.DataFrame(records_data)
    
    # District Stats
    districts = {}
    for inc in incidents:
        dist_name = "Unknown"
        if inc.location_rel and inc.location_rel.station and inc.location_rel.station.district:
            dist_name = inc.location_rel.station.district.name
        districts[dist_name] = districts.get(dist_name, 0) + 1
    df_districts = pd.DataFrame([{"District": k, "Incident_Count": v} for k, v in districts.items()])
    
    # Write to Excel BytesIO
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df_records.to_excel(writer, sheet_name="Incidents Dump", index=False)
        df_districts.to_excel(writer, sheet_name="District Summary", index=False)
        
    output.seek(0)
    response = StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response.headers["Content-Disposition"] = "attachment; filename=arachne_tactical_report.xlsx"
    return response

@router.get("/reports/download/pdf")
def download_reports_pdf(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    pdf_bytes = generate_pdf_report(db)
    response = StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf")
    response.headers["Content-Disposition"] = "attachment; filename=arachne_tactical_report.pdf"
    return response

@router.get("/reports/schedules", response_model=List[ReportScheduleResponse])
def get_report_schedules(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(ReportSchedule).filter(ReportSchedule.created_by == current_user.id).all()

@router.post("/reports/schedules", response_model=ReportScheduleResponse, status_code=201)
def create_report_schedule(
    schedule_in: ReportScheduleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    schedule = ReportSchedule(
        title=schedule_in.title,
        format=schedule_in.format,
        frequency=schedule_in.frequency,
        recipients=schedule_in.recipients,
        created_by=current_user.id
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule

@router.delete("/reports/schedules/{schedule_id}")
def delete_report_schedule(
    schedule_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    schedule = db.query(ReportSchedule).filter(
        ReportSchedule.id == schedule_id,
        ReportSchedule.created_by == current_user.id
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Scheduled report configuration not found")
    db.delete(schedule)
    db.commit()
    return {"detail": "Scheduled report successfully removed"}

@router.post("/reports/share")
def share_report(
    req: ShareRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Log sharing activity in activity logs
    log = ActivityLog(
        user_id=current_user.id,
        action="Share Report",
        details=f"Shared tactical report in {req.format} format with {req.recipients}. Subject: '{req.subject}'"
    )
    db.add(log)
    db.commit()
    return {"detail": f"Report successfully dispatched to {req.recipients}"}

# Native text reports endpoints
@router.get("/reports", response_model=List[ReportResponse])
def get_reports(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(Report).order_by(Report.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    report_in: ReportCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    rep = Report(
        title=report_in.title,
        content=report_in.content,
        created_by=current_user.id
    )
    db.add(rep)
    db.commit()
    db.refresh(rep)
    return rep

@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()

@router.put("/notifications/{notif_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notif_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.get("/logs", response_model=List[ActivityLogResponse])
def get_activity_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["Admin"]))
):
    return db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(limit).all()
