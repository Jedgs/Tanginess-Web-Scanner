// Tanginess Frozen Yogurt - Admin Module: QR Order Scanner
// Data Structure Used: Array of Objects
// DSA Used: Manual traversal, manual searching, manual insertion, and manual summation
"use strict";

// Temporary storage for the latest scanned order.
let currentScannedOrder = null;

// Stores all scanned online orders.
const scannedOrderDetails = [];

// Stores confirmed orders after cashier checks the QR details.
const confirmedOrderDetails = [];

let html5QrCode = null;
let isScannerRunning = false;

const reader = document.getElementById("reader");
const startScannerButton = document.getElementById("startScannerButton");
const stopScannerButton = document.getElementById("stopScannerButton");
const confirmOrderButton = document.getElementById("confirmOrderButton");
const orderDetailsContainer = document.getElementById("orderDetailsContainer");
const scanLogsContainer = document.getElementById("scanLogsContainer");
const scannerStatus = document.getElementById("scannerStatus");

function formatMoney(amount) {
  return "Php " + amount;
}

function setScannerStatus(message) {
  scannerStatus.textContent = message;
}

// Manual Insertion Algorithm
// Purpose: Mag-insert ng scanned/confirmed order sa array.
// Time Complexity: O(1), dahil direct insert sa last index.
// Space Complexity: O(1), dahil isang object lang ang dinadagdag.
function insertOrder(arrayStorage, order) {
  arrayStorage[arrayStorage.length] = order;
}

// Manual Searching Algorithm
// Purpose: Hanapin kung existing na ang orderId sa scanned orders.
// Time Complexity: O(n), dahil pwedeng madaanan lahat ng scanned orders.
// Space Complexity: O(1), dahil fixed variables lang ang gamit.
function searchScannedOrderById(orderId) {
  for (let index = 0; index < scannedOrderDetails.length; index++) {
    if (scannedOrderDetails[index].orderId === orderId) {
      return scannedOrderDetails[index];
    }
  }

  return null;
}

// Manual Searching Algorithm
// Purpose: Hanapin kung confirmed na ang orderId.
// Time Complexity: O(n), dahil pwedeng madaanan lahat ng confirmed orders.
// Space Complexity: O(1), dahil fixed variables lang ang gamit.
function searchConfirmedOrderById(orderId) {
  for (let index = 0; index < confirmedOrderDetails.length; index++) {
    if (confirmedOrderDetails[index].orderId === orderId) {
      return confirmedOrderDetails[index];
    }
  }

  return null;
}

// Manual Traversal Algorithm
// Purpose: Gumawa ng readable topping text.
// Time Complexity: O(n), dahil iniisa-isa lahat ng selected toppings.
// Space Complexity: O(1), hindi counted ang display string.
function buildToppingText(selectedToppings) {
  if (selectedToppings.length === 0) {
    return "Plain froyo only";
  }

  let toppingText = "";

  for (let index = 0; index < selectedToppings.length; index++) {
    toppingText = toppingText + selectedToppings[index].toppingName;

    if (index < selectedToppings.length - 1) {
      toppingText = toppingText + ", ";
    }
  }

  return toppingText;
}

// Manual Summation Algorithm
// Purpose: I-compute ulit ang order total from scanned items for cashier checking.
// Time Complexity: O(n), dahil iniisa-isa lahat ng order items.
// Space Complexity: O(1), dahil fixed variables lang ang gamit.
function computeScannedOrderSummary(order) {
  let totalCupQuantity = 0;
  let orderSubtotal = 0;

  for (let index = 0; index < order.items.length; index++) {
    totalCupQuantity = totalCupQuantity + order.items[index].quantity;
    orderSubtotal = orderSubtotal + order.items[index].lineTotal;
  }

  return {
    totalCupQuantity: totalCupQuantity,
    orderSubtotal: orderSubtotal
  };
}

function isValidOrderObject(order) {
  if (order === null) {
    return false;
  }

  if (typeof order.orderId === "undefined") {
    return false;
  }

  if (typeof order.customerId === "undefined") {
    return false;
  }

  if (typeof order.items === "undefined") {
    return false;
  }

  if (order.items.length < 1) {
    return false;
  }

  return true;
}

function isCompactQrPayload(payload) {
  if (payload === null) {
    return false;
  }

  if (typeof payload.o === "undefined") {
    return false;
  }

  if (typeof payload.i === "undefined") {
    return false;
  }

  return true;
}

// Manual Traversal Algorithm
// Purpose: Convert compact QR data into the same order object used by the cashier display.
// Time Complexity: O(n * m), dahil bawat item at toppings ay tinatraverse.
// Space Complexity: O(n * m), dahil gumagawa ng readable order copy.
function convertCompactPayloadToOrder(payload) {
  const orderItems = [];

  for (let itemIndex = 0; itemIndex < payload.i.length; itemIndex++) {
    const compactItem = payload.i[itemIndex];
    const selectedToppings = [];

    for (let toppingIndex = 0; toppingIndex < compactItem.st.length; toppingIndex++) {
      const compactTopping = compactItem.st[toppingIndex];

      selectedToppings[selectedToppings.length] = {
        toppingId: compactTopping.id,
        toppingName: compactTopping.n,
        category: compactTopping.c,
        extraPrice: compactTopping.e,
        premiumPrice: compactTopping.p,
        isIncluded: compactTopping.inc
      };
    }

    orderItems[orderItems.length] = {
      cartItemId: compactItem.ci,
      cupDetails: {
        cupId: compactItem.c.id,
        cupName: compactItem.c.n,
        cupType: compactItem.c.t,
        includedToppings: compactItem.c.it,
        basePrice: compactItem.c.bp
      },
      selectedToppings: selectedToppings,
      quantity: compactItem.q,
      extraToppingCount: compactItem.etc,
      extraToppingTotal: compactItem.ett,
      premiumToppingTotal: compactItem.ptt,
      plainFroyoAddOn: compactItem.pfa,
      unitTotal: compactItem.ut,
      lineTotal: compactItem.lt
    };
  }

  return {
    orderId: payload.o,
    customerId: payload.cid,
    customerName: payload.cn,
    orderType: payload.ot,
    orderStatus: payload.os,
    paymentStatus: payload.ps,
    items: orderItems,
    totalCupQuantity: payload.tq,
    orderSubtotal: payload.st,
    createdAt: payload.d
  };
}

function readQrPayload(qrText) {
  let scannedOrder = null;

  try {
    scannedOrder = JSON.parse(qrText);
  } catch (error) {
    setScannerStatus("Invalid QR data. The QR text is not a valid order.");
    alert("Invalid QR data. The QR text is not a valid order.");
    return;
  }

  if (isCompactQrPayload(scannedOrder) === true) {
    scannedOrder = convertCompactPayloadToOrder(scannedOrder);
  }

  if (isValidOrderObject(scannedOrder) === false) {
    setScannerStatus("Invalid Tanginess order QR.");
    alert("Invalid Tanginess order QR.");
    return;
  }

  currentScannedOrder = scannedOrder;

  if (searchScannedOrderById(scannedOrder.orderId) === null) {
    insertOrder(scannedOrderDetails, scannedOrder);
  }

  displayScannedOrder(scannedOrder);
  displayScanLogs();
  setScannerStatus("Order scanned successfully: " + scannedOrder.orderId);
}

// Manual Traversal Algorithm
// Purpose: I-display lahat ng items ng scanned order.
// Time Complexity: O(n), dahil iniisa-isa lahat ng items.
// Space Complexity: O(1), hindi counted ang HTML output string.
function displayScannedOrder(order) {
  const summary = computeScannedOrderSummary(order);
  let orderHTML = "";

  orderHTML = orderHTML +
    "<p><strong>Order ID:</strong> " + order.orderId + "</p>" +
    "<p><strong>Customer ID:</strong> " + order.customerId + "</p>" +
    "<p><strong>Customer Name:</strong> " + order.customerName + "</p>" +
    "<p><strong>Order Type:</strong> " + order.orderType + "</p>" +
    "<p><strong>Order Status:</strong> " + order.orderStatus + "</p>" +
    "<p><strong>Payment Status:</strong> " + order.paymentStatus + "</p>" +
    "<p><strong>Created At:</strong> " + order.createdAt + "</p>" +
    "<h4>Ordered Cups</h4>";

  for (let index = 0; index < order.items.length; index++) {
    const item = order.items[index];

    orderHTML = orderHTML +
      "<div>" +
        "<p><strong>Item " + (index + 1) + "</strong></p>" +
        "<p>Cup: " + item.cupDetails.cupName + "</p>" +
        "<p>Cup Type: " + item.cupDetails.cupType + "</p>" +
        "<p>Included Toppings: " + item.cupDetails.includedToppings + "</p>" +
        "<p>Selected Toppings: " + buildToppingText(item.selectedToppings) + "</p>" +
        "<p>Quantity: " + item.quantity + "</p>" +
        "<p>Extra Topping Total: " + formatMoney(item.extraToppingTotal) + "</p>" +
        "<p>Premium Topping Total: " + formatMoney(item.premiumToppingTotal) + "</p>" +
        "<p>Plain Froyo Add-on: " + formatMoney(item.plainFroyoAddOn) + "</p>" +
        "<p>Unit Total: " + formatMoney(item.unitTotal) + "</p>" +
        "<p>Line Total: " + formatMoney(item.lineTotal) + "</p>" +
      "</div>" +
      "<hr>";
  }

  orderHTML = orderHTML +
    "<h4>Total Cup Quantity: " + summary.totalCupQuantity + "</h4>" +
    "<h4>Computed Subtotal: " + formatMoney(summary.orderSubtotal) + "</h4>";

  orderDetailsContainer.innerHTML = orderHTML;
}

// Manual Traversal Algorithm
// Purpose: I-display lahat ng scanned orders sa scan logs.
// Time Complexity: O(n), dahil iniisa-isa lahat ng scanned orders.
// Space Complexity: O(1), hindi counted ang HTML output string.
function displayScanLogs() {
  let logsHTML = "";

  if (scannedOrderDetails.length === 0) {
    scanLogsContainer.innerHTML = "<p>No scanned orders yet.</p>";
    return;
  }

  for (let index = 0; index < scannedOrderDetails.length; index++) {
    const order = scannedOrderDetails[index];
    const summary = computeScannedOrderSummary(order);

    logsHTML = logsHTML +
      "<div>" +
        "<p><strong>" + order.orderId + "</strong></p>" +
        "<p>Customer: " + order.customerName + "</p>" +
        "<p>Total Cups: " + summary.totalCupQuantity + "</p>" +
        "<p>Subtotal: " + formatMoney(summary.orderSubtotal) + "</p>" +
        "<p>Status: " + order.orderStatus + "</p>" +
      "</div>" +
      "<hr>";
  }

  scanLogsContainer.innerHTML = logsHTML;
}

function confirmScannedOrder() {
  if (currentScannedOrder === null) {
    alert("Scan an order first before confirming.");
    return;
  }

  if (searchConfirmedOrderById(currentScannedOrder.orderId) !== null) {
    alert("This order is already confirmed.");
    return;
  }

  currentScannedOrder.orderStatus = "Confirmed by Cashier";
  currentScannedOrder.paymentStatus = "Ready for Billing";
  insertOrder(confirmedOrderDetails, currentScannedOrder);

  displayScannedOrder(currentScannedOrder);
  displayScanLogs();
  alert("Order confirmed and ready for billing.");
}

async function startScanner() {
  if (typeof Html5Qrcode === "undefined") {
    setScannerStatus("QR scanner library did not load.");
    alert("QR scanner library did not load.");
    return;
  }

  if (isScannerRunning === true) {
    return;
  }

  html5QrCode = new Html5Qrcode("reader");

  try {
    setScannerStatus("Opening camera. Allow camera permission if the browser asks.");

    await html5QrCode.start(
      {
        facingMode: "environment"
      },
      {
        fps: 20,
        qrbox: {
          width: 360,
          height: 360
        },
        disableFlip: false
      },
      function onScanSuccess(decodedText) {
        readQrPayload(decodedText);
        stopScanner();
      },
      function onScanFailure() {
        setScannerStatus("Scanning... keep the whole QR inside the box and avoid glare.");
      }
    );

    isScannerRunning = true;
    setScannerStatus("Scanner is running. Put the whole QR inside the square box.");
  } catch (error) {
    setScannerStatus("Camera cannot start/read. Open this page using localhost or HTTPS, then allow camera permission.");
    alert("Camera scanner cannot start. Open this page using localhost or HTTPS, then allow camera permission.");
  }
}

async function stopScanner() {
  if (html5QrCode === null) {
    return;
  }

  if (isScannerRunning === false) {
    return;
  }

  await html5QrCode.stop();
  isScannerRunning = false;
  setScannerStatus("Scanner stopped.");
}

function startAdminModule() {
  startScannerButton.addEventListener("click", startScanner);
  stopScannerButton.addEventListener("click", stopScanner);
  confirmOrderButton.addEventListener("click", confirmScannedOrder);
  displayScanLogs();
}

startAdminModule();
