from pydantic import BaseModel


class EquipmentAutocompleteResponse(BaseModel):
    id: str
    name: str
    category: str