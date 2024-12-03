from fastapi import FastAPI
from fastapi import HTTPException
from pymongo import MongoClient
from pydantic import BaseModel
from bson import ObjectId

# Konekcija s MongoDB-om
client = MongoClient("mongodb://localhost:27017")  # Spoji se na MongoDB
db = client["TechCompanies"]  # Odaberi bazu podataka "TechCompanies"
collection = db["companies"]  # Odaberi kolekciju "companies"

class Company(BaseModel):
    company_id: str
    company_name: str
    founder: str
    established_year: int
    headquarters: str
    industry: str
    number_of_employees: int
    annual_revenue: int
    website: str
    products: list[str]
    description: str

def response_wrapper(status: str, data: dict = None, message: str = "") -> dict:
    return {
        "status": status,
        "data": data,
        "message": message
    }

# Kreiranje FastAPI aplikacije
app = FastAPI()

# Endpoint za dohvaćanje svih podataka iz kolekcije "companies"
@app.get("/companies")
async def get_companies():
    companies = list(collection.find({}, {"_id": 0}))  # Dohvati sve, bez "_id"
    if companies:
        return response_wrapper("success", {"companies": companies}, "Companies retrieved successfully.")
    return response_wrapper("error", None, "No companies found.")

# Endpoint za dohvaćanje specifične tvrtke prema nazivu
@app.get("/companies/name/{name}")
async def get_company_by_name(name: str):
    company = collection.find_one({"company_name": name}, {"_id": 0})
    if company:
        return response_wrapper("success", {"company": company}, "Company found.")
    return response_wrapper("error", None, "Company not found")

@app.get("/companies/founder/{name}")
async def get_company_by_founder(name: str):
    companies = list(collection.find({"founder": name}, {"_id": 0}))
    if companies:
        return response_wrapper("success", {"companies": [company for company in companies]}, "Companies found")
    return response_wrapper("error", None, "No  companies under that founder.")

@app.get("/companies/foundedBefore/{year}")
async def get_company_by_year_earlier(year: int):
    companies = list(collection.find({"established_year": {"$lt": year}}, {"_id": 0}))
    if companies:
        return response_wrapper("success", {"companies": [company for company in companies]}, "Companies found.")
    return response_wrapper("error", None, "No founded companies before "+str(year))

@app.get("/companies/foundedAfter/{year}")
async def get_company_by_year_later(year: int):
    companies = list(collection.find({"established_year": {"$gt": year}}, {"_id": 0}))
    if companies:
         return response_wrapper("success", {"companies": [company for company in companies]}, "Companies found.")
    return response_wrapper("error", None, "No founded companies after "+str(year))

@app.post("/companies", response_model=dict)
async def add_company(company: Company):
    companyDict=company.dict()
    result=collection.insert_one(companyDict)
    companyDict["_id"]=str(result.inserted_id)
    return response_wrapper("success", companyDict, "Company added")

@app.delete("/companies/{name}")
async def delete_company(name: str):
    result = collection.delete_one({"company_name": name})
    if result.deleted_count==0:
        raise HTTPException(status_code=400, detail="Company not found")
    return response_wrapper("success", None, f"Company '{name}' deleted successfully.")

@app.put("/companies/{company_id}")
async def update_company(company_id: str, company: Company):
    try:
        updated_data = company.dict()
        result = collection.update_one(
            {"_id": ObjectId(company_id)},
            {"$set": updated_data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Company not found.")
        updated_company = collection.find_one({"_id": ObjectId(company_id)})
        updated_company["_id"] = str(updated_company["_id"])
        return response_wrapper("success", {"company":updated_company}, "Company successfully altered.")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid company ID format.")