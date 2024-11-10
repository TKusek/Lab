
let filteredCompanies = [];  // Globalna varijabla za filtrirane podatke


async function dohvatiPodatke(){
    try {
        const response = await fetch('/api/companies'); // Dohvaća podatke s backend-a
        const companies = await response.json();
        return companies;
    } catch (error) {
        console.error("Greška pri dohvaćanju podataka:", error);
    }
}

async function popuniTablicu(companies) {
    const tableBody = document.querySelector('#dataTable tbody');
    tableBody.innerHTML = '';  // Očisti trenutnu tablicu prije dodavanja novih podataka

    companies.forEach(company => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${company.company_id}</td>
            <td>${company.company_name}</td>
            <td>${company.founder}</td>
            <td>${company.established_year}</td>
            <td>${company.headquarters}</td>
            <td>${company.industry}</td>
            <td>${company.number_of_employees}</td>
            <td>${company.annual_revenue}</td>
            <td>${company.website}</td>
            <td>${company.products.join(', ')}</td>
            <td>${company.description}</td>
        `;
        tableBody.appendChild(row);
    });
}

async function filtrirajPodatke() {
    const keyword = document.getElementById('filterKeyword').value.toLowerCase() || '';
    const attributeIndex =parseInt(document.getElementById('filterAttribute').value);

    const companies = await dohvatiPodatke();
    const tableBody = document.querySelector('#dataTable tbody');
    tableBody.innerHTML = '';

    filteredCompanies = companies.filter(company => {
        const attributes = [
            company.company_id,
            company.company_name,
            company.founder,
            company.established_year,
            company.headquarters,
            company.industry,
            company.number_of_employees,
            company.annual_revenue,
            company.website,
            company.products,
            company.description
        ];
        if (attributeIndex === 9) { // Filter by product, which is an array
            return company.products.some(product => product.toLowerCase().includes(keyword));
        } else {
            const attributeValue = attributes[attributeIndex];
            if (typeof attributeValue === 'number') {
                return attributeValue.toString().toLowerCase().includes(keyword);
            }
            return attributes[attributeIndex].toLowerCase().includes(keyword);
        }
    });

    filteredCompanies.forEach(company => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${company.company_id}</td>
            <td>${company.company_name}</td>
            <td>${company.founder}</td>
            <td>${company.established_year}</td>
            <td>${company.headquarters}</td>
            <td>${company.industry}</td>
            <td>${company.number_of_employees}</td>
            <td>${company.annual_revenue}</td>
            <td>${company.website}</td>
            <td>${company.products.join(', ')}</td>
            <td>${company.description}</td>
        `;
        tableBody.appendChild(row);
    });
}




document.getElementById('downloadJson').addEventListener('click', function() {
    const filteredData = filteredCompanies; 
    const json = JSON.stringify(filteredData);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filtered_companies.json';
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('downloadCsv').addEventListener('click', function() {
    const csv = json2csv.parse(filteredCompanies); 

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filtered_companies.csv';
    a.click();
    URL.revokeObjectURL(url);
});

document.addEventListener('DOMContentLoaded', async function() {
    const companies = await dohvatiPodatke();
    filteredCompanies = companies; // Postavi sve podatke u filteredCompanies
    popuniTablicu(companies); // Popuni tablicu sa svim podacima
    document.querySelector('button').addEventListener('click', filtrirajPodatke); // Dodaj event listener za filtriranje
});
