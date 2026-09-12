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
const manualQrInput = document.getElementById("manualQrInput");
const startScannerButton = document.getElementById("startScannerButton");
const stopScannerButton = document.getElementById("stopScannerButton");
const manualScanButton = document.getElementById("manualScanButton");
const confirmOrderButton = document.getElementById("confirmOrderButton");
const orderDetailsContainer = document.getElementById("orderDetailsContainer");
const scanLogsContainer = document.getElementById("scanLogsContainer");

function formatMoney(amount) {
  return "Php " + amount;
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

function readQrPayload(qrText) {
  let scannedOrder = null;

  try {
    scannedOrder = JSON.parse(qrText);
  } catch (error) {
    alert("Invalid QR data. The QR text is not a valid order.");
    return;
  }

  if (isValidOrderObject(scannedOrder) === false) {
    alert("Invalid Tanginess order QR.");
    return;
  }

  currentScannedOrder = scannedOrder;

  if (searchScannedOrderById(scannedOrder.orderId) === null) {
    insertOrder(scannedOrderDetails, scannedOrder);
  }

  displayScannedOrder(scannedOrder);
  displayScanLogs();
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
    alert("QR scanner library did not load.");
    return;
  }

  if (isScannerRunning === true) {
    return;
  }

  html5QrCode = new Html5Qrcode("reader");

  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250
        }
      },
      function onScanSuccess(decodedText) {
        readQrPayload(decodedText);
        stopScanner();
      }
    );

    isScannerRunning = true;
  } catch (error) {
    alert("Camera scanner cannot start. You can paste the QR text manually.");
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
}

function readManualQr() {
  const qrText = manualQrInput.value;
  readQrPayload(qrText);
}

function startAdminModule() {
  startScannerButton.addEventListener("click", startScanner);
  stopScannerButton.addEventListener("click", stopScanner);
  manualScanButton.addEventListener("click", readManualQr);
  confirmOrderButton.addEventListener("click", confirmScannedOrder);
  displayScanLogs();
}

startAdminModule();
