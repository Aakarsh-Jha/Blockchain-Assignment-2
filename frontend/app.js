/**
 * CertiTrust Frontend Application Logic
 * Pure Web3 Integration with MetaMask & Ethers.js v6
 * CSE4444 Blockchain Technology Assignment 2
 *
 * NOTE: All interactions strictly call the on-chain smart contract.
 * No simulated data or client-side bypasses.
 */

// Contract ABI matching CertificateVerifier.sol exactly
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

// Application State Variables
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
    logToConsole("MetaMask extension detected. Click 'Connect MetaMask' to connect your wallet.", "info");
  } else {
    logToConsole("MetaMask extension not found in this browser. Please install MetaMask to use this DApp.", "error");
    showToast("MetaMask Required", "Please install the MetaMask browser extension to interact with the blockchain.", "error");
  }
}

function setupEventListeners() {
  document.getElementById("connectWalletBtn").addEventListener("click", connectWallet);
  document.getElementById("loadContractBtn").addEventListener("click", () => {
    const address = document.getElementById("contractAddressInput").value.trim();
    if (address) {
      loadContract(address);
    } else {
      alert("Please paste your deployed contract address first.");
    }
  });

  if (window.ethereum) {
    // Listen to real MetaMask account switches
    window.ethereum.on("accountsChanged", async (accounts) => {
      if (accounts && accounts.length > 0) {
        currentAccount = accounts[0];
        if (provider) signer = await provider.getSigner();
        if (contract && signer) {
          contract = contract.connect(signer);
        }
        updateAccountUI();
        logToConsole(`Active MetaMask account switched to: ${currentAccount}`, "info");
        showToast("Account Switched", `Active wallet: ${currentAccount.substring(0, 10)}...`, "info");
      } else {
        currentAccount = null;
        signer = null;
        updateAccountUI();
        logToConsole("Wallet disconnected in MetaMask.", "warn");
      }
    });

    // Listen to network change
    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });
  }
}

// Connect MetaMask
async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask is not installed. Please install MetaMask to connect.");
    return;
  }

  try {
    logToConsole("Requesting wallet access via MetaMask...", "info");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    currentAccount = accounts[0];

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    const network = await provider.getNetwork();

    updateAccountUI();
    document.getElementById("networkDot").classList.add("connected");
    document.getElementById("networkName").innerText = `${network.name || "Network"} (ID: ${network.chainId})`;

    logToConsole(`Connected wallet: ${currentAccount} on Chain ID ${network.chainId}`, "success");
    showToast("Wallet Connected", `Connected: ${currentAccount.substring(0, 8)}... on Chain ${network.chainId}`, "success");

    const address = document.getElementById("contractAddressInput").value.trim();
    if (address) {
      await loadContract(address);
    }
  } catch (error) {
    console.error("MetaMask connection failed:", error);
    logToConsole(`Connection error: ${error.message}`, "error");
    showToast("Connection Error", error.message, "error");
  }
}

function updateAccountUI() {
  const btn = document.getElementById("connectWalletBtn");
  const accDisplay = document.getElementById("activeAccountDisplay");
  const roleBadge = document.getElementById("activeRoleBadge");
  const bar = document.getElementById("accountBar");

  if (currentAccount) {
    const shortAddress = `${currentAccount.substring(0, 6)}...${currentAccount.substring(currentAccount.length - 4)}`;
    btn.innerHTML = `<span>${shortAddress}</span>`;
    btn.classList.remove("btn-primary");
    btn.classList.add("btn-outline");

    bar.style.display = "flex";
    accDisplay.innerText = currentAccount;

    const isOwner = contractOwnerAddress && currentAccount.toLowerCase() === contractOwnerAddress.toLowerCase();
    if (isOwner) {
      roleBadge.className = "role-badge role-admin";
      roleBadge.innerText = "Authority (Owner)";
    } else {
      roleBadge.className = "role-badge role-unauthorized";
      roleBadge.innerText = "Non-Owner (Unauthorized)";
    }
  } else {
    btn.innerHTML = `<span>Connect MetaMask</span>`;
    btn.classList.add("btn-primary");
    btn.classList.remove("btn-outline");
    accDisplay.innerText = "Not connected";
    bar.style.display = "none";
  }
}

// Request MetaMask to switch accounts
async function requestAccountSwitch() {
  if (!window.ethereum) return;
  try {
    // Open MetaMask permission prompt to select/switch account
    await window.ethereum.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }]
    });
  } catch (err) {
    // If user cancels or not supported, provide instructions
    alert("In MetaMask, click the circle account icon at the top and select Account 2 (or create a second account) to test unauthorized access.");
  }
}

// Load Smart Contract at address on the active chain
async function loadContract(address) {
  try {
    if (!ethers.isAddress(address)) {
      alert("Invalid Ethereum contract address format.");
      return;
    }

    if (!provider) {
      if (!window.ethereum) {
        alert("MetaMask is required to query the contract.");
        return;
      }
      provider = new ethers.BrowserProvider(window.ethereum);
    }

    // Verify code exists on chain at this address
    const code = await provider.getCode(address);
    if (code === "0x" || code === "0x0") {
      const err = "No smart contract found at this address on the currently connected network.";
      document.getElementById("contractStatusText").innerText = "No contract at address";
      document.getElementById("contractStatusText").style.color = "#f87171";
      logToConsole(`Error: ${err}`, "error");
      alert(err + "\nMake sure you are on the same network in MetaMask where you deployed the contract in Remix.");
      return;
    }

    if (!signer && window.ethereum) {
      signer = await provider.getSigner();
    }

    contract = new ethers.Contract(address, CONTRACT_ABI, signer || provider);
    localStorage.setItem("certi_contract_address", address);

    document.getElementById("contractStatusText").innerText = `Loaded: ${address.substring(0, 10)}...`;
    document.getElementById("contractStatusText").style.color = "#34d399";
    logToConsole(`Contract loaded on-chain at: ${address}`, "success");
    showToast("Contract Loaded", `Successfully connected to contract ${address.substring(0, 8)}...`, "success");

    await refreshContractStats();
  } catch (error) {
    console.error("Error loading contract:", error);
    document.getElementById("contractStatusText").innerText = "Failed to load contract";
    document.getElementById("contractStatusText").style.color = "#f87171";
    logToConsole(`Failed to load contract: ${extractRevertReason(error)}`, "error");
  }
}

// Query on-chain institution summary
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

    updateAccountUI();
    logToConsole(`On-chain state read: Institution="${instName}", Owner=${contractOwnerAddress}, Certificates=${totalCount}`, "info");
  } catch (error) {
    console.error("Error reading contract stats:", error);
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

// Real On-Chain Certificate Issuance (Requires Owner Signer)
async function handleIssueCertificate(e) {
  if (e) e.preventDefault();

  if (!contract) {
    alert("Please load your deployed contract first.");
    return;
  }
  if (!signer) {
    await connectWallet();
    if (!signer) return;
  }

  const studentName = document.getElementById("studentNameInput").value;
  const courseName = document.getElementById("courseNameInput").value;
  const certHash = document.getElementById("certHashInput").value;

  const submitBtn = document.getElementById("submitIssueBtn");
  submitBtn.disabled = true;
  submitBtn.innerText = "Confirm in MetaMask...";

  try {
    logToConsole(`Calling contract.issueCertificate("${studentName}", "${courseName}", "${certHash}")...`, "info");
    
    // Connect contract with active signer
    const contractWithSigner = contract.connect(signer);

    // This triggers MetaMask popup and executes real on-chain transaction
    const tx = await contractWithSigner.issueCertificate(studentName, courseName, certHash);
    
    logToConsole(`Transaction submitted! Hash: ${tx.hash}`, "info");
    submitBtn.innerText = "Mining Transaction...";
    showToast("Transaction Pending", `Submitted to blockchain. Tx: ${tx.hash.substring(0, 18)}...`, "info", tx.hash);

    // Wait for real block confirmation
    const receipt = await tx.wait(1);

    logToConsole(`Transaction mined in block #${receipt.blockNumber}! Gas used: ${receipt.gasUsed.toString()}`, "success");
    showToast("Certificate Issued On-Chain!", `Successfully mined in block #${receipt.blockNumber}.`, "success", tx.hash);

    await refreshContractStats();
    document.getElementById("issueCertForm").reset();
  } catch (error) {
    console.error("Issue transaction failed:", error);
    const reason = extractRevertReason(error);
    logToConsole(`Transaction Reverted: ${reason}`, "error");
    showToast("Transaction Reverted", reason, "error");
    alert(`Transaction Failed on Blockchain:\n\n${reason}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Issue Certificate on Blockchain";
  }
}

// Real On-Chain Certificate Revocation (Calls contract.revokeCertificate)
async function handleRevokeCertificate(e) {
  if (e) e.preventDefault();

  if (!contract) {
    alert("Please load your deployed contract first.");
    return;
  }
  if (!signer) {
    await connectWallet();
    if (!signer) return;
  }

  const id = document.getElementById("revokeIdInput").value;
  if (!id) {
    alert("Please enter a Certificate ID to revoke.");
    return;
  }

  const submitBtn = document.getElementById("submitRevokeBtn");
  submitBtn.disabled = true;
  submitBtn.innerText = "Confirm in MetaMask...";

  try {
    logToConsole(`Calling contract.revokeCertificate(${id})...`, "info");
    const contractWithSigner = contract.connect(signer);

    const tx = await contractWithSigner.revokeCertificate(id);
    logToConsole(`Revocation tx submitted! Hash: ${tx.hash}`, "info");
    submitBtn.innerText = "Mining Transaction...";

    const receipt = await tx.wait(1);
    logToConsole(`Certificate #${id} revoked on-chain in block #${receipt.blockNumber}!`, "success");
    showToast(`Certificate #${id} Revoked On-Chain`, `Mined in block #${receipt.blockNumber}.`, "success", tx.hash);

    await refreshContractStats();
    document.getElementById("revokeCertForm").reset();
  } catch (error) {
    console.error("Revoke error:", error);
    const reason = extractRevertReason(error);
    logToConsole(`Revocation Reverted: ${reason}`, "error");
    showToast("Revocation Failed", reason, "error");
    alert(`Revocation Failed on Blockchain:\n\n${reason}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Revoke Certificate";
  }
}

// Real On-Chain Credential Verification (Read Call)
async function handleVerifyCertificate(e) {
  if (e) e.preventDefault();

  if (!contract) {
    alert("Please load your deployed contract first.");
    return;
  }

  const id = document.getElementById("verifyIdInput").value;
  if (!id) {
    alert("Please enter a Certificate ID to verify.");
    return;
  }

  const submitBtn = document.getElementById("submitVerifyBtn");
  submitBtn.disabled = true;
  submitBtn.innerText = "Querying On-Chain...";

  try {
    logToConsole(`Querying blockchain for Certificate ID #${id}...`, "info");
    
    // Call contract view function
    const cert = await contract.verifyCertificate(id);

    // Format retrieved blockchain data
    document.getElementById("resCertId").innerText = `#${cert[0].toString()}`;
    document.getElementById("resStudentName").innerText = cert[1];
    document.getElementById("resCourseName").innerText = cert[2];
    document.getElementById("resCertHash").innerText = cert[3];

    const timestamp = Number(cert[4]);
    const date = new Date(timestamp * 1000);
    document.getElementById("resTimestamp").innerText = date.toUTCString();

    const isValid = cert[5];
    const badge = document.getElementById("resCertStatusBadge");
    if (isValid) {
      badge.className = "cert-badge badge-valid";
      badge.innerHTML = "<span>&#x2714; AUTHENTIC & VALID</span>";
    } else {
      badge.className = "cert-badge badge-revoked";
      badge.innerHTML = "<span>&#x2716; REVOKED / INVALID</span>";
    }

    document.getElementById("verifyPlaceholder").style.display = "none";
    document.getElementById("certPreviewCard").classList.add("active");

    logToConsole(`Data retrieved on-chain for Certificate #${id}: Student="${cert[1]}", Valid=${isValid}`, "success");
    showToast("Certificate Verified", `Record #${id} retrieved from Ethereum blockchain.`, "success");
  } catch (error) {
    console.error("Verification query error:", error);
    const reason = extractRevertReason(error);
    logToConsole(`Verification Query Failed: ${reason}`, "error");
    showToast("Verification Error", reason, "error");
    alert(`Verification Query Failed:\n\n${reason}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Verify Data";
  }
}

// Assignment Test Fillers (Populates inputs without faking the transaction)
function fillTestScenario(type) {
  switchAdminTab("issue");

  if (type === "valid") {
    document.getElementById("studentNameInput").value = "Aarav Sharma";
    document.getElementById("courseNameInput").value = "B.Tech Computer Science & Engineering";
    document.getElementById("certHashInput").value = "REG-2024-CSE-8921";
    logToConsole("Test 1: Valid inputs filled. Click 'Issue Certificate on Blockchain' to confirm via MetaMask.", "info");
    showToast("Inputs Prepared", "Valid student details loaded. Click Issue to sign transaction.", "info");
  } else if (type === "invalid") {
    // Clear student name to demonstrate require(bytes(_studentName).length > 0)
    document.getElementById("studentNameInput").value = "";
    document.getElementById("courseNameInput").value = "B.Tech Computer Science";
    document.getElementById("certHashInput").value = "REG-FAIL-TEST";
    logToConsole("Test 2: Empty student name filled. Click 'Issue Certificate on Blockchain' to see the contract revert on-chain.", "warn");
    showToast("Invalid Input Prepared", "Empty name loaded. Click Issue to see on-chain revert error.", "info");
  } else if (type === "unauthorized") {
    document.getElementById("studentNameInput").value = "Imposter Student";
    document.getElementById("courseNameInput").value = "B.Tech Data Science";
    document.getElementById("certHashInput").value = "REG-UNAUTH-01";
    logToConsole("Test 3: Make sure you switch to Account 2 (Non-Owner) in MetaMask, then click 'Issue Certificate' to trigger the onlyOwner revert.", "warn");
    alert("Test 3 (Unauthorized Test Instructions):\n\n1. In your MetaMask extension, switch to Account 2 (or any account that did NOT deploy the contract).\n2. Then click 'Issue Certificate on Blockchain'.\n\nYour smart contract's onlyOwner modifier will reject the transaction with:\n'Error: Unauthorized! Only the university authority can perform this action.'");
  }
}

// Extract clean revert reason string from ethers.js error object
function extractRevertReason(err) {
  if (err.reason) return err.reason;
  if (err.data && err.data.message) return err.data.message;
  if (err.error && err.error.message) return err.error.message;
  if (err.info && err.info.error && err.info.error.message) return err.info.error.message;
  if (err.shortMessage) return err.shortMessage;
  if (err.message) {
    const match = err.message.match(/reverted with reason string '([^']+)'/);
    if (match) return match[1];
    const customMatch = err.message.match(/reverted with custom error '([^']+)'/);
    if (customMatch) return customMatch[1];
    return err.message.length > 130 ? err.message.substring(0, 130) + "..." : err.message;
  }
  return "Transaction reverted by EVM.";
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

// Floating Toast Notification
function showToast(title, desc, type = "info", txHash = null) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type === "error" ? "error" : "success"}`;

  const icon = type === "error" ? "&#x26A0;" : "&#x2714;";
  let hashHtml = "";
  if (txHash) {
    hashHtml = `<div class="toast-hash">Tx: ${txHash.substring(0, 18)}...</div>`;
  }

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-body">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-desc">${escapeHtml(desc)}</div>
      ${hashHtml}
    </div>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = "opacity 0.4s ease";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 400);
  }, 5000);
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
