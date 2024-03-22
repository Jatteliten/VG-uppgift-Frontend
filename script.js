let productCache = new Map();

async function fetchProduct(productId) {
  if (productCache.has(productId)) {
    return productCache.get(productId);
  }

  const response = await fetch(`https://fakestoreapi.com/products/${productId}`);
  const productData = await response.json();

  productCache.set(productId, productData);

  return productData;
}

async function getTotalPriceForItem(productId) {
  const product = await fetchProduct(productId);
  return product.price;
}

async function fetchAndDisplayProductCards() {
  const cardRow = document.getElementById('cardRow');
  const resp = await fetch('https://fakestoreapi.com/products');
  const products = await resp.json();
  
  products.forEach(product => {
    createCard(product);
  });
}

function saveCartToStorage(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
  return JSON.parse(localStorage.getItem('cart')) || [];
}

window.addEventListener('beforeunload', function() {
  const cart = loadCartFromStorage();
  saveCartToStorage(cart);
});

function updateCartItemCount() {
  const cart = loadCartFromStorage();
  const cartItemCountElement = document.querySelector('.item-count');
  if (cartItemCountElement) {
    cartItemCountElement.textContent = cart.length.toString();
  }
}

async function createCard(product){
  try {
    const cardColumn = document.createElement('div');
    cardColumn.classList.add('col-12', 'col-sm-6', 'col-md-5','col-lg-4', 'col-xl-3', 'mb-2');

    const card = document.createElement('div');
    card.classList.add('card', 'custom-card');

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    const img = document.createElement('img');
    img.src = product.image;
    img.alt = "Image"
    img.classList.add('card-img-top');
    cardBody.appendChild(img);

    const cardText = createNewElementWithText('p', product.title);
    cardText.classList.add('card-text', 'mt-auto');
    cardBody.appendChild(cardText);

    const price = createNewElementWithText('p', product.price + "€");
    cardBody.appendChild(price);

    const addToCartButton = createNewElementWithText('button', 'Add to cart');
    addToCartButton.addEventListener('click', function(){
      const cart = loadCartFromStorage();
      cart.push(product.id);
      saveCartToStorage(cart);
      updateCartItemCount();
    });
    cardBody.appendChild(addToCartButton);

    card.appendChild(cardBody);
    cardColumn.appendChild(card);

    cardRow.appendChild(cardColumn);
  } catch (error) {
    console.error(`Error fetching product data for ID ${productId}:`, error);
  }
}

function createNewElementWithText(elementType, text){
  const element = document.createElement(elementType);
  element.textContent = text;
  return element;
}

async function displayItemsInCart(){
  const itemInformation = document.getElementById('itemInformation')
  const set = new Set(JSON.parse(localStorage.getItem('cart')) || [])

  const promises = [];

  set.forEach(item =>{
    promises.push(createItemInCart(item));
  });

  await Promise.all(promises);

  createEmptyCartButton();
  createTotalPriceDisplay();
}

function createEmptyCartButton(){
  if(loadCartFromStorage().length !== 0){
    const removeAll = document.createElement('button');
    removeAll.classList.add('removeAllButton');
    removeAll.textContent = "Empty cart"
    removeAll.addEventListener('click', function(){
      localStorage.clear();
      updateCartItemCount();
      itemInformation.innerHTML = "";
      updateTotalPriceDisplay();
    })
    itemInformation.appendChild(removeAll);
  }
}

async function createTotalPriceDisplay(){
  const priceTotalDisplay = document.createElement('p');
  priceTotalDisplay.classList.add('totalPriceDisplayInCart');

  itemInformation.appendChild(priceTotalDisplay);

  updateTotalPriceDisplay(priceTotalDisplay);
}

async function updateTotalPriceDisplay() {
  const priceTotalDisplay = document.querySelector('.totalPriceDisplayInCart');
  if (!priceTotalDisplay) return;

  let priceTotal = 0;
  const cart = loadCartFromStorage();

  for (const productId of cart) {
    try {
      const totalPriceForItem = await getTotalPriceForItem(productId);
      priceTotal += Number(totalPriceForItem);
    } catch (error) {
      console.error(`Error calculating total price for item ${productId}:`, error);
    }
  }

  priceTotalDisplay.textContent = "Total: " + priceTotal.toFixed(2) + "$";
}

async function createItemInCart(item) {
  let resp = await fetch('https://fakestoreapi.com/products/' + item);
  let product = await resp.json();

  const itemInfo = document.createElement('div');
  itemInfo.classList.add('itemInformationRow');

  const img = document.createElement('img');
  img.classList.add('itemInformationRowImg');
  img.src = product.image;
  img.alt = "Image";
  itemInfo.appendChild(img);

  const controlsContainer = document.createElement('div');
  controlsContainer.classList.add('controls-container');
  
  const counter = document.createElement('p');
  let cart = loadCartFromStorage();
  counter.textContent = cart.filter(i => i === product.id).length;
  controlsContainer.appendChild(counter);

  const removeItem = document.createElement('p');
  removeItem.classList.add('removeItemIcon');
  removeItem.textContent = "X";
  removeItem.addEventListener('click', function() {
      let cart = loadCartFromStorage();
      cart = cart.filter(p => p !== product.id);
      saveCartToStorage(cart);
      updateCartItemCount();
      updateTotalPriceDisplay();
      removeItemsIfCartIsEmpty(cart);
      itemInfo.remove();
  });
  controlsContainer.appendChild(removeItem);

  const minusButton = document.createElement('button');
  minusButton.textContent = "-";
  minusButton.addEventListener('click', function() {
    let cart = loadCartFromStorage();
    const indexToRemove = cart.indexOf(product.id);
    if (indexToRemove !== -1) {
      cart.splice(indexToRemove, 1);
      saveCartToStorage(cart);
      updateCartItemCount();
      updateTotalItemPrice(cart, product, totalPrice);
      counter.textContent = cart.filter(i => i === product.id).length;
      if(cart.indexOf(product.id) == -1){
        itemInfo.remove();
      }
      removeItemsIfCartIsEmpty(cart);
      updateTotalPriceDisplay();
    }
  });
  controlsContainer.appendChild(minusButton);

  const plusButton = document.createElement('button');
  plusButton.textContent = "+";
  plusButton.addEventListener('click', function(){
    let cart = loadCartFromStorage();
    cart.push(product.id);
    saveCartToStorage(cart);
    updateCartItemCount();
    updateTotalItemPrice(cart, product, totalPrice);
    counter.textContent = cart.filter(i => i === product.id).length;
    updateTotalPriceDisplay();
  });
  controlsContainer.appendChild(plusButton);

  const totalPrice = document.createElement('p');
  updateTotalItemPrice(cart, product, totalPrice);
  controlsContainer.appendChild(totalPrice);

  itemInfo.appendChild(controlsContainer);

  itemInformation.appendChild(itemInfo);
}

function removeItemsIfCartIsEmpty(cart){
  if(cart.length == 0){
    itemInformation.innerHTML = "";
  }
}

async function updateTotalItemPrice(cart, product, totalPrice){
  const amount = cart.filter(i => i === product.id).length;
  totalPrice.textContent = (Number(amount) * Number(product.price)).toFixed(2) + "€";
}

async function createCustomerForm(){
  document.getElementById("myForm").addEventListener("submit", function(event) {
    event.preventDefault();
  
    let isValid = true;
  
    const nameInput = document.getElementById("name");
    const phoneNumberInput = document.getElementById("phone-number");
    const emailInput = document.getElementById("exampleInputEmail1");
    const streetNameInput = document.getElementById("streetName");
    const zipCodeInput = document.getElementById("zipCode");
    const cityInput = document.getElementById("city");
    
    const fullNamePattern = /^(?=.{2,50}$)(?:[a-zA-Z]+(?:\s[a-zA-Z]+){1,})$/;
    if (!fullNamePattern.test(nameInput.value.trim())) {
      isValid = false;
      nameInput.value = "";
      nameInput.placeholder = "Please enter first and last name";
      nameInput.classList.add("red-placeholder");
    } 
  
    const phonePattern = /^[\d()-]{0,50}$/;
    if (!phonePattern.test(phoneNumberInput.value.trim()) || phoneNumberInput.value.trim().length == 0) {
      isValid = false;
      phoneNumberInput.value = "";
      phoneNumberInput.placeholder = "Please enter correct phone number";
      phoneNumberInput.classList.add("red-placeholder");
    } 
    
    const emailPattern = /^[A-Za-z0-9\._%+\-]+@[A-Za-z0-9\.\-]+\.[A-Za-z]{2,}$/;
    if (!emailPattern.test(emailInput.value.trim())) {
      isValid = false;
      emailInput.value = "";
      emailInput.placeholder = "Please enter correct Email";
      emailInput.classList.add("red-placeholder");
    }
  
    if (streetNameInput.value.trim().length < 2 || streetNameInput.value.trim().length > 50) {
      isValid = false;
      streetNameInput.value = "";
      streetNameInput.placeholder = "Please enter a valid street name";
      streetNameInput.classList.add("red-placeholder");
    }
    const digitPattern = /^\d+$/;
    if (zipCodeInput.value.toString().trim().length !== 5 || !digitPattern.test(zipCodeInput.value.toString().trim())) {
      isValid = false;
      zipCodeInput.value = "";
      zipCodeInput.placeholder = "Please enter a valid zipcode (5 digits)";
      zipCodeInput.classList.add("red-placeholder");
    }
  
    if (cityInput.value.trim().length < 2 || cityInput.value.trim().length > 50) {
      isValid = false;
      cityInput.value = "";
      cityInput.placeholder = "Please enter a city";
      cityInput.classList.add("red-placeholder");
    }

    if(localStorage.getItem('cart') === "[]" || localStorage.getItem('cart') === null) {
      isValid = false;
      alert("Cart is empty");
    }
  
    if(isValid){
      localStorage.customerName = nameInput.value;
      window.location.href = "confirmation.html";
    }
    
  });
}

async function createConfirmationMessage(){
  const confirmationMessage = document.getElementById('confirmationMessage');
  confirmationMessage.textContent = "Thank you for your order " + localStorage.customerName + "!";
}

async function createReceipt() {
  const products = loadCartFromStorage();
  const uniqueProducts = new Set(products);

  let totalCost = 0;

  const receipt = document.getElementById('receipt');
  for (const product of uniqueProducts) {
    totalCost += await createReceiptInformation(product);
  }

  total = document.createElement('p');
  total.classList.add('totalPrice', 'receiptEntry');
  total.textContent = "Total: " + totalCost + "€";
  receipt.appendChild(total);
  localStorage.clear();
  updateCartItemCount();
}

async function createReceiptInformation(product){
  let resp = await fetch('https://fakestoreapi.com/products/' + product);
  let json = await resp.json();
  let counter = loadCartFromStorage().filter(i => i === json.id).length;
  receiptEntry = document.createElement('p');
  price = Number(json.price) * Number(counter);
  article = json.title;
  receiptEntry.textContent = counter + "x " + article + " - " + price + "€";
  receiptEntry.classList.add('receiptEntry');
  receipt.appendChild(receiptEntry)

  return price;
}

updateCartItemCount()