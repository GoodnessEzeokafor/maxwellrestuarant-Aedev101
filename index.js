const contractSource = `


payable contract Reservations =
  
    
  record reserve = 
    {
    owner: address,
    id : int,
    name : string,
    meal : string,
    users : int,
    price : int,
    timestamp : int
    }
    
  record state = {
    reserves : map(int, reserve),
    orders : int}
    
  entrypoint init() = { 
    reserves = {},
    orders = 0}


  //returns lenght of orders
  entrypoint ordersLength() : int = 
    state.orders  
    
  entrypoint getOrder(index : int) = 
    switch(Map.lookup(index, state.reserves))
      None => abort("Order doesnt exist")
      Some(x) => x  


    //Registers Meal Order
    
  payable stateful entrypoint createReservation( name' : string, meal' : string, price' :int,  users' : int) = 
    let timestamp = Chain.timestamp
    let newOrder = {
      id = ordersLength()+1,
      name = name', 
      owner  = Call.caller,
      meal = meal',
      users= users',
      price = price',
      timestamp = timestamp}
    
    let index = ordersLength() + 1

    put(state{reserves[index] = newOrder, orders = index})
    pay(price')

  
    
  entrypoint getPrice(index : int) = 
    state.reserves[index].price

  payable stateful entrypoint pay(price : int) = 
    Chain.spend(Contract.address, price)  

  

  
  

  
  
  
    
  
    `;


const contractAddress = 'ct_5vELhqMU4gC18i5VDvPmHoRxM1zfDf7yHBkJWMKgV7SGrk88h';
var orderArray = [];
var client = null;
var orders = 0;



function renderOrder() {
  orderArray = orderArray.sort(function (a, b) {
    return b.Price - a.Price
  })
  var template = $('#template').html();

  Mustache.parse(template);
  var rendered = Mustache.render(template, {
    orderArray
  });




  $('#body').html(rendered);

}

async function callStatic(func, args) {

  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });

  const calledGet = await contract.call(func, args, {
    callStatic: true
  }).catch(e => console.error(e));

  const decodedGet = await calledGet.decode().catch(e => console.error(e));

  return decodedGet;
}

async function contractCall(func, args, value) {
  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });

  const calledSet = await contract.call(func, args, {
    amount: value
  }).catch(e => console.error(e));

  return calledSet;
}

window.addEventListener('load', async () => {
  $("#loadings").show();

  client = await Ae.Aepp()
  console.log("Client:",client)
  mealLength = await callStatic('ordersLength', []);


  for (let i = 1; i <= mealLength; i++) {
    const Orders = await callStatic('getOrder', [i]);



    orderArray.push({
      meal: Orders.meal,
      name: Orders.name,
      users: Orders.users,
      price: Orders.price,
      timestamp: new Date(Orders.timestamp),
      owner: Orders.owner



    })
  }
  renderOrder();
  $("#loadings").hide();
});







function getTotal() {
  var doc = document.getElementById('totalprice')
  doc.innerHTML("total price : ", ($('#users').val()) * 300);
}


$('#placeOrder').click(async function () {
  $("#loadings").show();

  name = ($('#name').val()),

    users = ($('#users').val()),


    meal = ($('#Meal').val());

  price = users * 300
  await contractCall('createReservation', [name, meal, price, users], parseInt(price, 10))





  orderArray.push({
    name: name,
    meal: meal,
    price: price,
    users: users



  })
  renderOrder();
  // location.reload(true);
  $("#loadings").hide();

  console.log("SUCCESSFUL")

  document.getElementById("confirmation").innerHTML = " Reservation purchased Successfully"

  // $.colorbox({html:"<h1>Reservation booked successfully</h1>"});
});
