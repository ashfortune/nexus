from app.core.database import Base
from sqlalchemy import String, ForeignKey, Integer, SmallInteger, Boolean, Text, Date, TIMESTAMP, JSON, DOUBLE_PRECISION, text, Numeric
from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from sqlalchemy import String, Integer, SmallInteger, Text, TIMESTAMP, Boolean, text
from typing import Optional, List
import datetime
import uuid

class RegionCode(Base):
    __tablename__ = "region_codes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    region_code: Mapped[int] = mapped_column(Integer, nullable=False)
    city_name: Mapped[str] = mapped_column(String(10), nullable=False)
    county_name: Mapped[str] = mapped_column(String(10), nullable=False)
    latitude: Mapped[float] = mapped_column(Numeric(13, 10), nullable=True)
    longitude: Mapped[float] = mapped_column(Numeric(13, 10), nullable=True)

class IndustryCategory(Base):
    __tablename__ = "industry_categories"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("industry_categories.id", ondelete="SET NULL"))
    level: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    ksic_code: Mapped[Optional[str]] = mapped_column(String(20))
    embedding: Mapped[Optional[Vector]] = mapped_column(Vector(768)) # AI 의미 검색용 벡터
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, server_default=text("NOW()"))

    # Relationships
    parent: Mapped[Optional["IndustryCategory"]] = relationship("IndustryCategory", remote_side=[id], back_populates="children")
    children: Mapped[List["IndustryCategory"]] = relationship("IndustryCategory", back_populates="parent")
    equipment_prices: Mapped[List["EquipmentPrice"]] = relationship(back_populates="industry_category")
    brandings: Mapped[List["Branding"]] = relationship(back_populates="industry_category")
    license_mappings: Mapped[List["LicenseIndustryMapping"]] = relationship(back_populates="category")

class EquipmentPrice(Base):
    __tablename__ = "equipment_prices"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    industry_category_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("industry_categories.id"))
    equipment_kr: Mapped[Optional[str]] = mapped_column(String)
    equipment_eng: Mapped[Optional[str]] = mapped_column(String)
    product_name: Mapped[Optional[str]] = mapped_column(String)
    price: Mapped[Optional[int]] = mapped_column(Integer)
    detail: Mapped[Optional[str]] = mapped_column(String)
    link: Mapped[Optional[str]] = mapped_column(String(500))
    image_url: Mapped[Optional[str]] = mapped_column(String(500))
    source: Mapped[Optional[str]] = mapped_column(String)

    # Relationships
    industry_category: Mapped[Optional["IndustryCategory"]] = relationship(back_populates="equipment_prices")

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nickname: Mapped[Optional[str]] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    passwd: Mapped[str] = mapped_column(String(255), nullable=False)
    user_type: Mapped[Optional[int]] = mapped_column(Integer, server_default=text("0"))
    biz_no: Mapped[Optional[str]] = mapped_column(String(12))
    address: Mapped[Optional[str]] = mapped_column(String(255))
    login_type: Mapped[Optional[int]] = mapped_column(Integer, server_default=text("0"))
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, server_default=text("NOW()"))

    # Relationships
    brandings: Mapped[List["Branding"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    sales: Mapped[List["Sale"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    predictions: Mapped[List["Prediction"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    reviews: Mapped[List["Review"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    ai_reports: Mapped[List["AIReport"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    boards: Mapped[List["Board"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    comments: Mapped[List["Comment"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    group_purchases: Mapped[List["GroupPurchase"]] = relationship(back_populates="user")
    group_orders: Mapped[List["GroupOrder"]] = relationship(back_populates="user")
    chat_participants: Mapped[List["ChatParticipant"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    chat_messages: Mapped[List["ChatMessage"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    labor_contracts: Mapped[List["LaborContract"]] = relationship(back_populates="user")
    checklist_progresses: Mapped[List["ChecklistProgress"]] = relationship(back_populates="user", cascade="all, delete-orphan")

# Import types for relationship resolution at the end of the file or use string references

class Branding(Base):
    __tablename__ = "brandings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    industry_category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("industry_categories.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    keywords: Mapped[Optional[dict]] = mapped_column(JSON)
    chat_history: Mapped[Optional[list]] = mapped_column(JSON)
    current_step: Mapped[Optional[str]] = mapped_column(String(20), server_default=text("'INTERVIEW'"))
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, server_default=text("NOW()"))

    # Relationships
    user: Mapped["User"] = relationship(back_populates="brandings")
    industry_category: Mapped["IndustryCategory"] = relationship(back_populates="brandings")
    identities: Mapped[List["BrandIdentity"]] = relationship(back_populates="branding", cascade="all, delete-orphan")

class BrandIdentity(Base):
    __tablename__ = "brand_identities"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    branding_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("brandings.id", ondelete="CASCADE"), nullable=False)
    brand_name: Mapped[str] = mapped_column(String(100), nullable=False)
    slogan: Mapped[Optional[str]] = mapped_column(String(255))
    brand_story: Mapped[Optional[str]] = mapped_column(Text)
    is_selected: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text("false"))
    embedding: Mapped[Optional[Vector]] = mapped_column(Vector(768)) # 브랜드 정체성 의미 벡터
    
    # Relationships

    branding: Mapped["Branding"] = relationship(back_populates="identities")
    logo_assets: Mapped[list["LogoAsset"]] = relationship(back_populates="brand_identity", cascade="all, delete-orphan")
    marketing_assets: Mapped[list["MarketingAsset"]] = relationship(back_populates="brand_identity", cascade="all, delete-orphan")

class LogoAsset(Base):
    __tablename__ = "logo_assets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    identity_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("brand_identities.id", ondelete="CASCADE"), nullable=False)
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    style_tag: Mapped[Optional[str]] = mapped_column(String(50))
    is_final: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text("false"))

    # Relationships
    brand_identity: Mapped["BrandIdentity"] = relationship(back_populates="logo_assets")

class MarketingAsset(Base):
    __tablename__ = "marketing_assets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    identity_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("brand_identities.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    file_url: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    brand_identity: Mapped["BrandIdentity"] = relationship(back_populates="marketing_assets")


class LicenseIndustry(Base):
    __tablename__ = "license_industries"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    law_name: Mapped[str] = mapped_column(String(200), nullable=False)
    law_article: Mapped[Optional[str]] = mapped_column(String(100))
    license_type: Mapped[str] = mapped_column(String(20), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relationships
    surveys: Mapped[List["Survey"]] = relationship(back_populates="license_industry", cascade="all, delete-orphan")
    documents: Mapped[List["Document"]] = relationship(back_populates="license_industry", cascade="all, delete-orphan")
    license_mappings: Mapped[List["LicenseIndustryMapping"]] = relationship(back_populates="license")
    checklist_progresses: Mapped[List["ChecklistProgress"]] = relationship(back_populates="license_industry", cascade="all, delete-orphan")
    checklist_steps: Mapped[List["ChecklistStep"]] = relationship(back_populates="license_industry", cascade="all, delete-orphan")
class Survey(Base):
    __tablename__ = "surveys"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    license_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("license_industries.id", ondelete="CASCADE"), nullable=False)
    question: Mapped[str] = mapped_column(String(300), nullable=False)
    order_num: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    # Relationships
    license_industry: Mapped["LicenseIndustry"] = relationship(back_populates="surveys")
    survey_documents: Mapped[List["SurveyDocument"]] = relationship(back_populates="survey", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    license_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("license_industries.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    issuer: Mapped[str] = mapped_column(String(100), nullable=False)
    is_common: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))

    # Relationships
    license_industry: Mapped["LicenseIndustry"] = relationship(back_populates="documents")
    survey_links: Mapped[List["SurveyDocument"]] = relationship(back_populates="document")

class SurveyDocument(Base):
    __tablename__ = "survey_documents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    survey_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("surveys.id", ondelete="CASCADE"), nullable=False)
    answer: Mapped[bool] = mapped_column(Boolean, nullable=False)
    document_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("documents.id"), nullable=False)

    # Relationships
    survey: Mapped["Survey"] = relationship(back_populates="survey_documents")
    document: Mapped["Document"] = relationship(back_populates="survey_links")

class ChecklistStep(Base):
    __tablename__ = "checklist_steps"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    license_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("license_industries.id", ondelete="CASCADE"), nullable=False)
    order_num: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    place: Mapped[str] = mapped_column(String(100), nullable=False)
    task: Mapped[str] = mapped_column(String(300), nullable=False)
    estimated_days: Mapped[Optional[str]] = mapped_column(String(50))

    # Relationships
    license_industry: Mapped["LicenseIndustry"] = relationship(back_populates="checklist_steps")

class LicenseIndustryMapping(Base):
    __tablename__ = "license_industry_mappings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("industry_categories.id"), nullable=False)
    license_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("license_industries.id"), nullable=False)

    # Relationships
    category: Mapped["IndustryCategory"] = relationship(back_populates="license_mappings")
    license: Mapped["LicenseIndustry"] = relationship()

class LaborContract(Base):
    __tablename__ = "labor_contracts"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    employer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    employee_name: Mapped[str] = mapped_column(String(100), nullable=False)
    start_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    workplace: Mapped[str] = mapped_column(String(200), nullable=False)
    job_description: Mapped[str] = mapped_column(String(300), nullable=False)
    daily_work_hours: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    weekly_work_days: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    hourly_wage: Mapped[int] = mapped_column(Integer, nullable=False)
    weekly_allowance: Mapped[Optional[int]] = mapped_column(Integer)
    employee_type: Mapped[str] = mapped_column(String(20), nullable=False)
    pdf_url: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, server_default=text("NOW()"))

    # Relationships
    user: Mapped[Optional["User"]] = relationship(back_populates="labor_contracts")

class Subsidy(Base):
    __tablename__ = "subsidies"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    organization: Mapped[str] = mapped_column(String(100), nullable=False)
    region: Mapped[Optional[str]] = mapped_column(String(100))
    industry: Mapped[Optional[str]] = mapped_column(String(100))
    min_age: Mapped[Optional[int]] = mapped_column(SmallInteger)
    max_age: Mapped[Optional[int]] = mapped_column(SmallInteger)
    max_amount: Mapped[Optional[int]] = mapped_column(Integer)
    deadline: Mapped[Optional[datetime.date]] = mapped_column(Date)
    start_date: Mapped[Optional[datetime.date]] = mapped_column(Date)
    description: Mapped[Optional[str]] = mapped_column(Text)
    support_content: Mapped[Optional[str]] = mapped_column(Text)
    target: Mapped[Optional[str]] = mapped_column(Text)
    how_to_apply: Mapped[Optional[str]] = mapped_column(Text)
    contact: Mapped[Optional[str]] = mapped_column(Text)
    apply_url: Mapped[Optional[str]] = mapped_column(Text)
    source_url: Mapped[Optional[str]] = mapped_column(String(500), unique=True)
    embedding: Mapped[Optional[list]] = mapped_column(Vector(768))
    life_cycle: Mapped[Optional[str]] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"))
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, server_default=text("NOW()"))
    updated_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, server_default=text("NOW()"))

class ChecklistProgress(Base):
    __tablename__ = "checklist_progresses"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    license_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("license_industries.id"), nullable=False)
    current_step: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default=text("1"))
    industry_code: Mapped[Optional[str]] = mapped_column(String(50))
    conditions: Mapped[Optional[dict]] = mapped_column(JSON)
    updated_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, server_default=text("NOW()"))

    # Relationships
    user: Mapped["User"] = relationship(back_populates="checklist_progresses")
    license_industry: Mapped["LicenseIndustry"] = relationship(back_populates="checklist_progresses")

class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sales_date: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, nullable=False)
    total_amount: Mapped[Optional[int]] = mapped_column(Integer, server_default=text("0"))
    file_url: Mapped[Optional[str]] = mapped_column(String(255))
    store_number: Mapped[Optional[str]] = mapped_column(String(255))
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, server_default=text("NOW()"))

    # Relationships
    user: Mapped["User"] = relationship(back_populates="sales")
    items: Mapped[List["SaleItem"]] = relationship(back_populates="sale", cascade="all, delete-orphan")

class SaleItem(Base):
    __tablename__ = "sales_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    sale_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    item_name: Mapped[Optional[str]] = mapped_column(String(255))
    price: Mapped[Optional[int]] = mapped_column(Integer, server_default=text("0"))
    quantity: Mapped[Optional[int]] = mapped_column(Integer, server_default=text("1"))

    # Relationships
    sale: Mapped["Sale"] = relationship(back_populates="items")

class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    base_date: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, nullable=False)
    total_sales: Mapped[Optional[int]] = mapped_column(Integer)
    predicted_cost: Mapped[Optional[int]] = mapped_column(Integer)
    moving_average: Mapped[Optional[float]] = mapped_column(DOUBLE_PRECISION)
    return_rate: Mapped[Optional[float]] = mapped_column(DOUBLE_PRECISION)
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, server_default=text("NOW()"))

    # Relationships
    user: Mapped["User"] = relationship(back_populates="predictions")
    daily_predictions: Mapped[List["DailyPrediction"]] = relationship(back_populates="prediction", cascade="all, delete-orphan")

class DailyPrediction(Base):
    __tablename__ = "daily_predictions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    prediction_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("predictions.id", ondelete="CASCADE"), nullable=False)
    target_date: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, nullable=False)
    pred_sales: Mapped[Optional[int]] = mapped_column(Integer)
    actual_sales: Mapped[Optional[int]] = mapped_column(Integer)
    moving_average: Mapped[Optional[float]] = mapped_column(DOUBLE_PRECISION)
    return_rate: Mapped[Optional[float]] = mapped_column(DOUBLE_PRECISION)

    # Relationships
    prediction: Mapped["Prediction"] = relationship(back_populates="daily_predictions")

class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text)
    tokens: Mapped[Optional[str]] = mapped_column(Text)
    sentiment_score: Mapped[Optional[float]] = mapped_column(DOUBLE_PRECISION)
    sentiment_label: Mapped[Optional[str]] = mapped_column(String(20))
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, server_default=text("NOW()"))

    # Relationships
    user: Mapped["User"] = relationship(back_populates="reviews")

class AIReport(Base):
    __tablename__ = "ai_reports"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    evaluation_summary: Mapped[Optional[str]] = mapped_column(Text)
    report_file_url: Mapped[Optional[str]] = mapped_column(String(255))
    pos_ratio: Mapped[Optional[float]] = mapped_column(DOUBLE_PRECISION)
    neg_ratio: Mapped[Optional[float]] = mapped_column(DOUBLE_PRECISION)
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, server_default=text("NOW()"))

    # Relationships
    user: Mapped["User"] = relationship(back_populates="ai_reports")


class Board(Base):
    __tablename__ = "boards"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text)
    region_name: Mapped[Optional[str]] = mapped_column(String(20))
    category_name: Mapped[Optional[str]] = mapped_column(String(20))
    view_count: Mapped[Optional[int]] = mapped_column(Integer, server_default=text("0"))
    image_url: Mapped[Optional[str]] = mapped_column(String(255))
    is_anonymous: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text("false"))
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, server_default=text("NOW()"))

    # Relationships
    user: Mapped["User"] = relationship(back_populates="boards")
    comments: Mapped[List["Comment"]] = relationship(back_populates="board", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    board_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("boards.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    parent_comment_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("comments.id", ondelete="CASCADE"))
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, server_default=text("NOW()"))

    # Relationships
    board: Mapped["Board"] = relationship(back_populates="comments")
    user: Mapped["User"] = relationship(back_populates="comments")
    parent: Mapped[Optional["Comment"]] = relationship("Comment", remote_side=[id], back_populates="children")
    children: Mapped[List["Comment"]] = relationship("Comment", back_populates="parent")

class GroupPurchase(Base):
    __tablename__ = "group_purchases"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    item_name: Mapped[str] = mapped_column(String(100), nullable=False)
    item_price: Mapped[int] = mapped_column(Integer, nullable=False)
    target_count: Mapped[int] = mapped_column(Integer, nullable=False)
    current_count: Mapped[Optional[int]] = mapped_column(Integer, server_default=text("1"))
    start_date: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP, server_default=text("NOW()"))
    end_date: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, nullable=False)
    status: Mapped[Optional[str]] = mapped_column(String(20), server_default=text("'RECRUITING'"))
    description: Mapped[Optional[str]] = mapped_column(Text)
    image_url: Mapped[Optional[str]] = mapped_column(Text)
    region: Mapped[Optional[str]] = mapped_column(String(100))

    # Relationships
    user: Mapped["User"] = relationship(back_populates="group_purchases")
    orders: Mapped[List["GroupOrder"]] = relationship(back_populates="group_purchase")

class GroupOrder(Base):
    __tablename__ = "group_orders"

    id: Mapped[str] = mapped_column(String(50), primary_key=True) # Order ID
    gp_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("group_purchases.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    order_count: Mapped[Optional[int]] = mapped_column(Integer, server_default=text("1"))
    total_price: Mapped[int] = mapped_column(Integer, nullable=False)
    pg_provider: Mapped[Optional[str]] = mapped_column(String(20))
    pg_tid: Mapped[Optional[str]] = mapped_column(String(200))
    payment_method: Mapped[Optional[str]] = mapped_column(String(50))
    payment_status: Mapped[Optional[str]] = mapped_column(String(20), server_default=text("'READY'"))
    paid_at: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP)

    # Relationships
    group_purchase: Mapped["GroupPurchase"] = relationship(back_populates="orders")
    user: Mapped["User"] = relationship(back_populates="group_orders")

class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[Optional[str]] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(Text)
    image_url: Mapped[Optional[str]] = mapped_column(String(500))
    type: Mapped[Optional[str]] = mapped_column(String(20), server_default=text("'GROUP'"))
    password: Mapped[Optional[str]] = mapped_column(String(255))
    last_message_at: Mapped[Optional[datetime.datetime]] = mapped_column(TIMESTAMP)
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, server_default=text("NOW()"))

    # Relationships
    participants: Mapped[List["ChatParticipant"]] = relationship(back_populates="chat_room", cascade="all, delete-orphan")
    messages: Mapped[List["ChatMessage"]] = relationship(back_populates="chat_room", cascade="all, delete-orphan")

class ChatParticipant(Base):
    __tablename__ = "chat_participants"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    room_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, server_default=text("NOW()"))

    # Relationships
    chat_room: Mapped["ChatRoom"] = relationship(back_populates="participants")
    user: Mapped["User"] = relationship(back_populates="chat_participants")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    room_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("chat_rooms.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[Optional[str]] = mapped_column(String(20), server_default=text("'TALK'"))
    file_url: Mapped[Optional[str]] = mapped_column(Text)
    file_name: Mapped[Optional[str]] = mapped_column(String(255))
    created_at: Mapped[datetime.datetime] = mapped_column(TIMESTAMP, server_default=text("NOW()"))

    # Relationships
    chat_room: Mapped["ChatRoom"] = relationship(back_populates="messages")
    user: Mapped["User"] = relationship(back_populates="chat_messages")

class SemasIndustryMapping(Base):
    __tablename__ = "semas_industry_mappings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    semas_ksic_code: Mapped[Optional[str]] = mapped_column(String(20))
    ksic_code: Mapped[Optional[str]] = mapped_column(String(20))
    large_category_name: Mapped[Optional[str]] = mapped_column(String(100))
    medium_category_name: Mapped[Optional[str]] = mapped_column(String(100))
    small_category_name: Mapped[Optional[str]] = mapped_column(String(100))

class AdministrativeBoundary(Base):
    __tablename__ = "administrative_boundaries"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    adm_cd: Mapped[str] = mapped_column(String(20), nullable=False)
    adm_nm: Mapped[str] = mapped_column(String(100), nullable=False)
    boundary: Mapped[Optional[dict]] = mapped_column(JSON, nullable=False)
