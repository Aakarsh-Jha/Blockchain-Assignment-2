# Assignment 2 - Smart Contract Test Execution Report

## Course: CSE4444 Blockchain Technology
## Project: CertiTrust - Decentralized Academic Credential Verification System
## Deployed Contract: `0xCfEB869F69431e42cdB54A4F4f105C19C080A601`
## Authority Owner Account: `0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1`
## Environment: Ganache Local Network (Chain ID: 1337)

---

### Test Scenario Matrix

| Test Case ID | Test Category | Caller Account | Input Parameters | Expected Outcome | Observed Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | **Valid Input** | Owner (University Authority) | `_studentName`: `"Aarav Sharma"`<br>`_courseName`: `"B.Tech Computer Science"`<br>`_certificateDataHash`: `"REG-2024-CSE-8921"` | Transaction mined in block; `certificateCount` increments to 1; `CertificateIssued` event emitted. | Transaction succeeded on-chain (Block #4, Tx: `0xe5abe127...`); Certificate ID #1 generated and state verified. | **PASSED** |
| **TC-02** | **Invalid Input** | Owner (University Authority) | `_studentName`: `""` (Empty string)<br>`_courseName`: `"B.Tech Computer Science"`<br>`_certificateDataHash`: `"REG-FAIL-TEST"` | Transaction reverts via `require` with: `"Validation Error: Student name cannot be empty."` | Transaction reverted immediately by EVM; gas preserved; zero state change. | **PASSED** |
| **TC-03** | **Unauthorized Caller** | Non-Owner Account | `_studentName`: `"Imposter Student"`<br>`_courseName`: `"B.Tech Data Science"`<br>`_certificateDataHash`: `"REG-UNAUTH-01"` | Transaction reverts via `onlyOwner` modifier with: `"Error: Unauthorized! Only the university authority can perform this action."` | Transaction rejected immediately with unauthorized access revert string. | **PASSED** |
| **TC-04** | **Data Retrieval (Public View)** | Any Public Account | `_id`: `1` | Smart contract returns stored struct fields: ID, Student Name, Degree, Hash, Timestamp, and `isValid = true`. | UI successfully parsed and displayed all on-chain credential records with live timestamp. | **PASSED** |
| **TC-05** | **Revocation Lifecycle** | Owner (University Authority) | `_id`: `1` | Certificate #1 `isValid` updated to `false`; `CertificateRevoked` event emitted. | Verification reflects updated status as `REVOKED / INVALID`. | **PASSED** |

---

### Detailed Test Execution Log

#### 1. Test Case 1: Valid Certificate Issuance
* **Method Executed:** `issueCertificate("Aarav Sharma", "B.Tech Computer Science & Engineering", "REG-2024-CSE-8921")`
* **Sender:** `0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1` (Deployer / University Authority)
* **Contract:** `0xCfEB869F69431e42cdB54A4F4f105C19C080A601`
* **Output:**
  * Status: `0x1 (Success)`
  * Block Number: `#4`
  * Transaction Hash: `0xe5abe127eb6d17c276fa487ebecda7ef15509d3bb8d73b57aa3632906fe5efc1`
  * Emitted Event: `CertificateIssued(id: 1, studentName: "Aarav Sharma", ...)`

#### 2. Test Case 2: Invalid Input Validation Revert
* **Method Executed:** `issueCertificate("", "B.Tech Computer Science", "REG-FAIL-TEST")`
* **Sender:** `0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1`
* **Output:**
  * Status: `0x0 (Transaction Reverted)`
  * Revert Reason: `Validation Error: Student name cannot be empty.`

#### 3. Test Case 3: Unauthorized Access Revert
* **Method Executed:** `issueCertificate("Imposter Student", "B.Tech Data Science", "REG-UNAUTH-01")`
* **Sender:** Non-owner account
* **Output:**
  * Status: `0x0 (Transaction Reverted)`
  * Revert Reason: `Error: Unauthorized! Only the university authority can perform this action.`
