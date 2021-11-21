class Controller {

  constructor() {
    this.changed_data = {};
    this.refresh_div = document.getElementById("refresh_div");
    this.add_new_pay_div = document.getElementById("add_new_pay_div");
    this.save_changes_div = document.getElementById("save_changes_div");
    this.print_records_div = document.getElementById("print_records_div");
    this.data_div = document.getElementById("data_div");
    this.loading_img = document.getElementById("loading-img"); 

    this.search_name = document.getElementById("search_name")
    this.search_amount = document.getElementById("search_amount")
    this.search_date = document.getElementById("search_date")
    
    this.run();
  }

  run() {
    this.refresh_div.onclick = this.refresh;
    this.add_new_pay_div.onclick = this.add_new_pay;
    this.save_changes_div.onclick = this.save_changes;
    this.print_records_div.onclick = this.print_records;
    document.getElementById("add_new_payment_popup").style.display = "none";
    document.getElementById("form_container").style.display = "none";

    document.getElementById("create_reciept_but").onclick = function(){

      let name = document.getElementById("create_person_name").value;
      let amount =  document.getElementById("create_person_amount").value;

      if (name.length > 0 && amount.length > 0){
        this.loading_img.style.display = "block";
        this.data_div.style.display = "none"
        render.send("NewReceipt", {name: name, amount: amount})
      }
      document.getElementById("add_new_payment_popup").click();
    }

    let start_filter =  this.start_filter;

    this.search_name.addEventListener("change", function(){
      start_filter()
    })

    this.search_amount.addEventListener("change", function(){
      start_filter()
    })

    this.search_date.addEventListener("change", function(){
      start_filter()
    })

    document.body.onclick = function(){
      var ctxMenu = document.getElementById("ctxMenu");
      ctxMenu.style.display = "";
      ctxMenu.style.left = "";
      ctxMenu.style.top = "";
    }

    this.refresh()
  }

  add_new_pay = () => {
    document.getElementById("add_new_payment_popup").style.display = "block";
    document.getElementById("form_container").style.display = "block";

    document.getElementById("add_new_payment_popup").onclick =  function(){
      document.getElementById("add_new_payment_popup").style.display = "none";
      document.getElementById("form_container").style.display = "none";
      document.getElementById("create_person_name").value = "";
      document.getElementById("create_person_amount").value = "";
    }
  }

  
  print_records = () => {
    render.send("RemoveAlwaysOnTop")
    var divContents = document.getElementById("data_div").innerHTML;
    var a = window.open("", "", "height=500, width=500");
    a.document.write('<html>');
    a.document.write(`
      <head>
        <meta charset="UTF-8">
        <!-- https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline';" >
        <link href="styles.css" rel="stylesheet">
      </head>
      <body >
        <style>
          #search input, .data_row input{
            border: 1px solid black;
          }
        </style>
        <br>
        <div id="search">
          <input value="Name of Person Paying">
          <input value="Amount Payed">
          <input value="When Person Payed">
        </div>
    `);
    a.document.write(divContents);
    a.document.write('</body></html>');
    a.document.close();
    a.print();
    a.close();
    render.send("AddAlwaysOnTop");
  }

  load_data = (data) => {
    this.changed_data = {};
    this.data_div.innerHTML = ""
    let input_c = this.inputs_on_change;

    for(var i = 0; i < data.length; i++){
      let item =  data[i];

      let new_doc = document.createElement("div");
      new_doc.className = "data_row";
      new_doc.id = `Receipt_Div_Id: ${item.id}`
      new_doc.innerHTML = `
        <input value="${item.name}" id="Receipt_Div_Id: ${item.id}_Name">
        <input value="${item.amount}" id="Receipt_Div_Id: ${item.id}_Amount">
        <input value="${item.date}" id="Receipt_Div_Id: ${item.id}_Date">
      `
      this.data_div.appendChild(new_doc)

      document.getElementById(`Receipt_Div_Id: ${item.id}_Name`).addEventListener("change", function(){
        input_c(item.id, `name`, this.value)
      })

      document.getElementById(`Receipt_Div_Id: ${item.id}_Amount`).addEventListener("change", function(){
        input_c(item.id, `amount`, this.value)
      })
      document.getElementById(`Receipt_Div_Id: ${item.id}_Date`).addEventListener("change", function(){
        input_c(item.id, `date`, this.value)
      })

      new_doc.addEventListener("contextmenu",function(event){
        event.preventDefault();
        var ctxMenu = document.getElementById("ctxMenu");
        ctxMenu.style.display = "block";
        ctxMenu.style.left = (event.pageX - 10)+"px";
        ctxMenu.style.top = (event.pageY - 10)+"px";

        document.getElementById("ctxMenuDelete").onclick = function(){
          this.loading_img.style.display = "block";
          this.data_div.style.display = "none"
          render.send("DeleteRow", {row: item.id})
          ctxMenu.style.display = "";
          ctxMenu.style.left = "";
          ctxMenu.style.top = "";
        }
      },false);
    }
    this.loading_img.style.display = "none";
    this.data_div.style.display = "block";
  }

  refresh = () => {
    this.loading_img.style.display = "block";
    this.data_div.style.display = "none";
    this.search_name.value = "";
    this.search_amount.value = "";
    this.search_date.value = "";
    render.send("GetReceiptAll")
  }

  inputs_on_change = (data_id, data_type, new_value) => {
    if (this.changed_data[data_id] === undefined){
      this.changed_data[data_id] = {}
    }
    this.changed_data[data_id][data_type] = new_value;
  }

  save_changes = () => {
    render.send("ChangeValues", this.changed_data)
  }

  start_filter = () => {
    this.loading_img.style.display = "block";
    this.data_div.style.display = "none"
    let name = this.search_name.value, 
    amount = this.search_amount.value, 
    date = this.search_date.value;
    
    if (name.length <= 0){
      name += " "
    }

    if (amount.length <= 0){
      amount += " "
    }

    if (date.length <= 0){
      date += " "
    }

    let query = `select * from Receipt where 
    name LIKE "%${name}%" 
    or amount LIKE "%${amount}%" 
    or date LIKE "%${date}%";`

    render.send("FilterData", {query: query})
  }
}