const table = [
    {
        Suburb:'Fitzroy',
        Crime :'2',
        State:'VIC',
    }, 
    {
        Suburb:'Carlton',
        Crime :'10',
        State:'VIC',
      },
      {
        Suburb:'Clayton',
        Crime :'10',
        State:'VIC',
      },
      {
        Suburb:'Tarneit',
        Crime :'12',
        State:'VIC',
      },
      {
        Suburb:'Malvern',
        Crime :'15',
        State:'VIC',
      },
      {
        Suburb:'Blackburn',
        Crime :'10',
        State:'VIC',
      },
      {
        Suburb:'Carnegie',
        Crime :'3',
        State:'VIC',
      },
      {
        Suburb:'Burwood',
        Crime :'29',
        State:'VIC',
      }
]

const tableHeader = Object.keys(table[0]);
const search = document.querySelector('.filter-input');
const output = document.querySelector('.output');

window.addEventListener('DOMContentLoaded', loadTable);
search.addEventListener('input', filter);


function loadTable(){
    let temp = `<table> <tr>`;
    tableHeader.forEach( header=> temp+= `<th> ${header.toUpperCase()} </th>`);
    temp+=`<tr>`
    table.forEach(row => {
        temp +=`
        <tr>
          <td>${row.Suburb}</td>
          <td>${row.Crime}</td>
          <td>${row.State}</td>
        </tr>
        `
    });

    temp+=`</table>`
    output.innerHTML = temp;
}


function filter(e){
let results;
let temp ="";

results = table.filter( item=> 
    item.Suburb.toLowerCase().includes(e.target.value.toLowerCase()) || 
    item.Crime.toLowerCase().includes(e.target.value.toLowerCase()) ||
    item.State.toLowerCase().includes(e.target.value.toLowerCase()) 
    );

   console.log(results)
    if(results.length>0){
        temp = `<table> <tr>`;
        tableHeader.forEach( header=> temp+= `<th> ${header.toUpperCase()} </th>`);
        temp+=`<tr>`
        results.forEach(row => {
            temp +=`
            <tr>
              <td>${row.Suburb}</td>
              <td>${row.Crime}</td>
              <td>${row.State}</td>
            </tr>
            `
        });
        temp+=`</table>`  
    }else{
        temp =`<div class="no-item">Item Not Found </div>`
    }

    output.innerHTML=temp;
}