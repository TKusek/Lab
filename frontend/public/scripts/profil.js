async function fja(){
    const response=await fetch("/podaci")
    if (!response.ok) {
        console.error("Greška pri dohvaćanju podataka");
        return;
    }
    const podaci = await response.json();
    const row=document.createElement("p")
    const row2=document.createElement("p")
    row.innerHTML="Name: "+podaci.name
    row2.innerHTML="Email: "+podaci.email
    const tijelo=document.getElementById("body")
    tijelo.appendChild(row)
    tijelo.appendChild(row2)
}

fja()