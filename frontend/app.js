/**
 * CertiTrust Frontend Application Logic
 * Integrates MetaMask with Ethers.js v6
 * CSE4444 Blockchain Technology Assignment 2
 */

// Contract ABI matching CertificateVerifier.sol
const CONTRACT_ABI = [
  {
    "inputs": [{ "internalType": "string", "name": "_institutionName", "type": "string" }],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "studentName", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "courseName", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "certificateDataHash", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "issueTimestamp", "type": "uint256" }
    ],
    "name": "CertificateIssued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "id", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "revokedTimestamp", "type": "uint256" }
    ],
    "name": "CertificateRevoked",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "certificateCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "certificates",
    "outputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "string", "name": "studentName", "type": "string" },
      { "internalType": "string", "name": "courseName", "type": "string" },
      { "internalType": "string", "name": "certificateDataHash", "type": "string" },
      { "internalType": "uint256", "name": "issueTimestamp", "type": "uint256" },
      { "internalType": "bool", "name": "isValid", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getInstitutionSummary",
    "outputs": [
      { "internalType": "string", "name": "_institutionName", "type": "string" },
      { "internalType": "address", "name": "_owner", "type": "address" },
      { "internalType": "uint256", "name": "_totalCertificates", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "institutionName",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_studentName", "type": "string" },
      { "internalType": "string", "name": "_courseName", "type": "string" },
      { "internalType": "string", "name": "_certificateDataHash", "type": "string" }
    ],
    "name": "issueCertificate",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
    "name": "revokeCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }],
    "name": "verifyCertificate",
    "outputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "string", "name": "studentName", "type": "string" },
      { "internalType": "string", "name": "courseName", "type": "string" },
      { "internalType": "string", "name": "certificateDataHash", "type": "string" },
      { "internalType": "uint256", "name": "issueTimestamp", "type": "uint256" },
      { "internalType": "bool", "name": "isValid", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Global State
let provider = null;
let signer = null;
let contract = null;
let currentAccount = null;
let contractOwnerAddress = null;

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
  initApp();
  setupEventListeners();
});

function initApp() {
  const savedAddress = localStorage.getItem("certi_contract_address");
  if (savedAddress) {
    document.getElementById("contractAddressInput").value = savedAddress;
  }
  
  if (window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
    logToConsole("MetaMask detected. Click 'Connect MetaMask' to initiate wallet handshake.", "info");
  } else {
    logToConsole("MetaMask extension not found in browser. Please install MetaMask.", "warn");
  }
}

function setupEventListeners() {
  document.getElementById("connectWalletBtn").addEventListener("click", connectWallet);
  document.getElementById("loadContractBtn").addEventListener("click", () => {
    const address = document.getElementById("contractAddressInput").value.trim();
    if (address) {
      loadContract(address);
    } else {
      alert("Please enter a valid deployed contract address first.");
    }
  });

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length > 0) {
        currentAccount = accounts[0];
        updateAccountUI();
        logToConsole(`Active MetaMask account changed to: ${currentAccount}`, "info");
      } else {
        currentAccount = null;
        updateAccountUI();
        logToConsole("Wallet disconnected.", "warn");
      }
    });

    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });
  }
}

// Connect MetaMask Wallet
async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask is not installed. Please install the MetaMask browser extension.");
    return;
  }

  try {
    logToConsole("Requesting account access from MetaMask...", "info");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    currentAccount = accounts[0];

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

    const network = await provider.getNetwork();
    
    // Update UI
    updateAccountUI();
    document.getElementById("networkDot").classList.add("connected");
    document.getElementById("networkName").innerText = `${network.name || "Chain"} (ID: ${network.chainId})`;
    
    logToConsole(`Successfully connected wallet: ${currentAccount} on Chain ID ${network.chainId}`, "success");

    // Auto load contract if address is provided
    const addressInput = document.getElementById("contractAddressInput").value.trim();
    if (addressInput) {
      loadContract(addressInput);
    }
  } catch (error) {
    console.error(error);
    logToConsole(`Wallet connection error: ${error.message}`, "error");
  }
}

function updateAccountUI() {
  const btn = document.getElementById("connectWalletBtn");
  if (currentAccount) {
    const shortAddress = `${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`;
    btn.innerHTML = `<span>${shortAddress}</span>`;
    btn.classList.remove("btn-primary");
    btn.classList.add("btn-outline");
  } else {
    btn.innerHTML = `<span>Connect MetaMask</span>`;
    btn.classList.add("btn-primary");
    btn.classList.remove("btn-outline");
  }
}

// Load Smart Contract Instance
async function loadContract(address) {
  try {
    if (!ethers.isAddress(address)) {
      alert("Invalid Ethereum contract address format.");
      return;
    }

    if (!provider) {
      provider = new ethers.BrowserProvider(window.ethereum);
    }
    if (!signer && window.ethereum) {
      signer = await provider.getSigner();
    }

    contract = new ethers.Contract(address, CONTRACT_ABI, signer || provider);
    localStorage.setItem("certi_contract_address", address);
    
    document.getElementById("contractStatusText").innerText = `Connected: ${address.substring(0, 8)}...`;
    document.getElementById("contractStatusText").style.color = "#34d399";
    logToConsole(`Contract loaded successfully at ${address}`, "success");

    await refreshContractStats();
  } catch (error) {
    console.error("Error loading contract:", error);
    document.getElementById("contractStatusText").innerText = "Failed to load contract";
    document.getElementById("contractStatusText").style.color = "#f87171";
    logToConsole(`Failed to load contract: ${extractRevertReason(error)}`, "error");
  }
}

// Fetch on-chain institution summary
async function refreshContractStats() {
  if (!contract) return;
  try {
    const summary = await contract.getInstitutionSummary();
    const instName = summary[0];
    contractOwnerAddress = summary[1];
    const totalCount = summary[2].toString();

    document.getElementById("statInstitution").innerText = instName || "N/A";
    document.getElementById("statOwner").innerText = contractOwnerAddress;
    document.getElementById("statTotalCertificates").innerText = totalCount;

    logToConsole(`Fetched on-chain summary: Institution="${instName}", Total Certificates=${totalCount}`, "info");
  } catch (error) {
    console.error("Error reading stats:", error);
    logToConsole(`Error reading contract state: ${extractRevertReason(error)}`, "warn");
  }
}

// Tab Switching
function switchAdminTab(tab) {
  const issueBtn = document.getElementById("tabIssueBtn");
  const revokeBtn = document.getElementById("tabRevokeBtn");
  const issueContent = document.getElementById("tabIssueContent");
  const revokeContent = document.getElementById("tabRevokeContent");

  if (tab === "issue") {
    issueBtn.classList.add("active");
    revokeBtn.classList.remove("active");
    issueContent.style.display = "block";
    revokeContent.style.display = "none";
  } else {
    revokeBtn.classList.add("active");
    issueBtn.classList.remove("active");
    revokeContent.style.display = "block";
    issueContent.style.display = "none";
  }
}

// Handle Issue Certificate Transaction (Admin)
async function handleIssueCertificate(e) {
  e.preventDefault();
  if (!contract) {
    alert("Please enter contract address and load the contract first.");
    return;
  }
  if (!currentAccount) {
    await connectWallet();
  }

  const studentName = document.getElementById("studentNameInput").value;
  const courseName = document.getElementById("courseNameInput").value;
  const certHash = document.getElementById("certHashInput").value;

  const submitBtn = document.getElementById("submitIssueBtn");
  submitBtn.disabled = true;
  submitBtn.innerText = "Confirming in MetaMask...";

  try {
    logToConsole(`Initiating transaction: issueCertificate("${studentName}", "${courseName}", "${certHash}")...`, "info");
    
    // Contract call with signer
    const tx = await contract.issueCertificate(studentName, courseName, certHash);
    logToConsole(`Transaction broadcasted! Tx Hash: ${tx.hash}`, "info");
    submitBtn.innerText = "Mining Transaction...";

    const receipt = await tx.wait(1);
    logToConsole(`Transaction mined successfully in block #${receipt.blockNumber}! Gas Used: ${receipt.gasUsed.toString()}`, "success");
    alert(`Certificate successfully issued on Ethereum blockchain!\nTx Hash: ${tx.hash}`);

    // Reset Form & Update
    document.getElementById("issueCertForm").reset();
    await refreshContractStats();
  } catch (error) {
    console.error("Issue Certificate error:", error);
    const reason = extractRevertReason(error);
    logToConsole(`Transaction Failed / Reverted: ${reason}`, "error");
    alert(`Transaction Reverted:\n${reason}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Issue Certificate on Blockchain";
  }
}

// Handle Revoke Certificate Transaction (Admin)
async function handleRevokeCertificate(e) {
  e.preventDefault();
  if (!contract) {
    alert("Please load contract first.");
    return;
  }

  const id = document.getElementById("revokeIdInput").value;
  const submitBtn = document.getElementById("submitRevokeBtn");
  submitBtn.disabled = true;
  submitBtn.innerText = "Confirming in MetaMask...";

  try {
    logToConsole(`Initiating revocation for Certificate #${id}...`, "info");
    const tx = await contract.revokeCertificate(id);
    logToConsole(`Revocation transaction sent! Tx Hash: ${tx.hash}`, "info");

    submitBtn.innerText = "Mining Transaction...";
    const receipt = await tx.wait(1);

    logToConsole(`Certificate #${id} successfully revoked in block #${receipt.blockNumber}`, "success");
    alert(`Certificate #${id} has been revoked on the blockchain.`);
    document.getElementById("revokeCertForm").reset();
  } catch (error) {
    console.error("Revoke error:", error);
    const reason = extractRevertReason(error);
    logToConsole(`Revocation Failed: ${reason}`, "error");
    alert(`Revocation Failed:\n${reason}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Revoke Certificate";
  }
}

// Handle Verify Certificate (Public Query - Read Call)
async function handleVerifyCertificate(e) {
  e.preventDefault();
  if (!contract) {
    alert("Please load contract first.");
    return;
  }

  const id = document.getElementById("verifyIdInput").value;
  const submitBtn = document.getElementById("submitVerifyBtn");
  submitBtn.disabled = true;
  submitBtn.innerText = "Querying...";

  try {
    logToConsole(`Querying blockchain storage for Certificate ID #${id}...`, "info");
    const cert = await contract.verifyCertificate(id);
    
    // Display retrieved data
    document.getElementById("resCertId").innerText = `#${cert.id.toString()}`;
    document.getElementById("resStudentName").innerText = cert.studentName;
    document.getElementById("resCourseName").innerText = cert.courseName;
    document.getElementById("resCertHash").innerText = cert.certificateDataHash;

    const date = new Date(Number(cert.issueTimestamp) * 1000);
    document.getElementById("resTimestamp").innerText = date.toUTCString();

    const badge = document.getElementById("resCertStatusBadge");
    if (cert.isValid) {
      badge.className = "cert-badge badge-valid";
      badge.innerHTML = "<span>&#x2714; AUTHENTIC & VALID</span>";
    } else {
      badge.className = "cert-badge badge-revoked";
      badge.innerHTML = "<span>&#x2716; REVOKED / INVALID</span>";
    }

    document.getElementById("verifyPlaceholder").style.display = "none";
    document.getElementById("certPreviewCard").classList.add("active");

    logToConsole(`Retrieved Certificate #${id}: Student="${cert.studentName}", Status=${cert.isValid ? "Valid" : "Revoked"}`, "success");
  } catch (error) {
    console.error("Verification error:", error);
    const reason = extractRevertReason(error);
    logToConsole(`Verification Failed: ${reason}`, "error");
    alert(`Verification Query Error:\n${reason}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Verify Data";
  }
}

// Test Suite Scenario Fillers (For Assignment Screenshots & Demo)
async function fillTestScenario(type) {
  if (type === "valid") {
    switchAdminTab("issue");
    document.getElementById("studentNameInput").value = "Aarav Sharma";
    document.getElementById("courseNameInput").value = "B.Tech Computer Science & Engineering";
    document.getElementById("certHashInput").value = "REG-2024-CSE-8921";
    logToConsole("Test 1 Prepared: Valid inputs loaded. Click 'Issue Certificate' to sign with MetaMask.", "info");
  } else if (type === "invalid") {
    switchAdminTab("issue");
    // Clear name or provide empty/invalid input
    document.getElementById("studentNameInput").value = "";
    document.getElementById("courseNameInput").value = "B.Tech Computer Science";
    document.getElementById("certHashInput").value = "REG-FAIL-TEST";
    
    // Bypass HTML validation by triggering contract call directly or asking user to test
    if (confirm("Test 2 (Invalid Input): Would you like to send an empty student name directly to the contract to demonstrate the 'Validation Error: Student name cannot be empty' revert?")) {
      try {
        if (!contract) { alert("Load contract first"); return; }
        logToConsole("Testing invalid input directly on contract...", "warn");
        const tx = await contract.issueCertificate("", "B.Tech Computer Science", "REG-FAIL-TEST");
        await tx.wait(1);
      } catch (err) {
        const reason = extractRevertReason(err);
        logToConsole(`[Expected Test Failure] Smart contract reverted with: "${reason}"`, "error");
        alert(`[Test 2 Result - Expected Revert Captured!]\n${reason}\n\nTake a screenshot of this failed transaction for your assignment!`);
      }
    }
  } else if (type === "unauthorized") {
    switchAdminTab("issue");
    if (contractOwnerAddress && currentAccount && contractOwnerAddress.toLowerCase() === currentAccount.toLowerCase()) {
      alert("Note: You are currently connected with the OWNER account.\n\nTo demonstrate Test Case 3 (Unauthorized Input):\n1. Open MetaMask extension.\n2. Switch to 'Account 2' (or any other account).\n3. Then click 'Issue Certificate'.\n\nThe contract will revert with: 'Error: Unauthorized! Only the university authority can perform this action.'");
      logToConsole("Test 3 Hint: Switch MetaMask to Account 2 to demonstrate unauthorized revert.", "warn");
    } else {
      if (confirm("Test 3 (Unauthorized Caller): Current wallet is not the contract owner. Attempt to issue a certificate now to capture the unauthorized revert?")) {
        try {
          if (!contract) { alert("Load contract first"); return; }
          const tx = await contract.issueCertificate("Unauthorized Test", "B.Tech", "REG-UNAUTH");
          await tx.wait(1);
        } catch (err) {
          const reason = extractRevertReason(err);
          logToConsole(`[Expected Test Failure - Unauthorized] Revert caught: "${reason}"`, "error");
          alert(`[Test 3 Result - Unauthorized Call Blocked!]\n${reason}\n\nTake a screenshot of this failed transaction for your assignment!`);
        }
      }
    }
  }
}

// Helper: Extract clean revert reason from ethers error
function extractRevertReason(err) {
  if (err.reason) return err.reason;
  if (err.data && err.data.message) return err.data.message;
  if (err.error && err.error.message) return err.error.message;
  if (err.info && err.info.error && err.info.error.message) return err.info.error.message;
  if (err.message) {
    const match = err.message.match(/reverted with reason string '([^']+)'/);
    if (match) return match[1];
    return err.message.length > 120 ? err.message.substring(0, 120) + "..." : err.message;
  }
  return "Unknown transaction error.";
}

// Activity Console Logging
function logToConsole(message, type = "info") {
  const consoleBox = document.getElementById("consoleBox");
  if (!consoleBox) return;

  const time = new Date().toLocaleTimeString();
  const entry = document.createElement("div");
  entry.className = "log-entry";
  
  let typeClass = "log-msg-info";
  if (type === "success") typeClass = "log-msg-success";
  else if (type === "warn") typeClass = "log-msg-warn";
  else if (type === "error") typeClass = "log-msg-error";

  entry.innerHTML = `
    <span class="log-time">[${time}]</span>
    <span class="${typeClass}">${escapeHtml(message)}</span>
  `;

  consoleBox.appendChild(entry);
  consoleBox.scrollTop = consoleBox.scrollHeight;
}

function clearLogs() {
  const consoleBox = document.getElementById("consoleBox");
  if (consoleBox) consoleBox.innerHTML = "";
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
