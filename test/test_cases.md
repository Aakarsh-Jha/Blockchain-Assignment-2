# Assignment 2 - Smart Contract Test Execution Report

## Course: CSE4444 Blockchain Technology
## Project: CertiTrust - Decentralized Academic Credential Verification System

---

### Test Scenario Matrix

| Test Case ID | Test Category | Caller Account | Input Parameters | Expected Outcome | Observed Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | **Valid Input** | Owner (University Authority) | `_studentName`: `"Aarav Sharma"`<br>`_courseName`: `"B.Tech Computer Science"`<br>`_certificateDataHash`: `"REG-2024-CSE-8921"` | Transaction mined; `certificateCount` increments to 1; `CertificateIssued` event emitted. | Transaction succeeded on-chain; Certificate ID #1 generated and state verified. | **PASSED** |
| **TC-02** | **Invalid Input** | Owner (University Authority) | `_studentName`: `""` (Empty string)<br>`_courseName`: `"B.Tech Computer Science"`<br>`_certificateDataHash`: `"REG-FAIL-TEST"` | Transaction reverts with revert string: `"Validation Error: Student name cannot be empty."` | Transaction reverted immediately; gas preserved; no state change. | **PASSED** |
| **TC-03** | **Unauthorized Caller** | Non-Owner Account (Account 2) | `_studentName`: `"Imposter Student"`<br>`_courseName`: `"B.Tech Data Science"`<br>`_certificateDataHash`: `"REG-UNAUTH-01"` | Transaction reverts via `onlyOwner` modifier with: `"Error: Unauthorized! Only the university authority can perform this action."` | Transaction failed with unauthorized access revert string. | **PASSED** |
| **TC-04** | **Data Retrieval (Public View)** | Any Public Account | `_id`: `1` | Smart contract returns stored struct fields: ID, Student Name, Degree, Hash, Timestamp, and `isValid = true`. | UI successfully parsed and displayed all on-chain credential records. | **PASSED** |
| **TC-05** | **Revocation Lifecycle** | Owner (University Authority) | `_id`: `1` | Certificate #1 `isValid` updated to `false`; `CertificateRevoked` event emitted. | UI reflects verification status as `REVOKED / INVALID`. | **PASSED** |

---

### Detailed Test Execution Log

#### 1. Test Case 1: Valid Certificate Issuance
* **Method Executed:** `issueCertificate(string, string, string)`
* **Sender:** `0x5B38Da6a701c568545dCfcB03FcB875f56beddC4` (Deployer / Owner)
* **Parameters:**
  * `_studentName`: `"Aarav Sharma"`
  * `_courseName`: `"B.Tech Computer Science & Engineering"`
  * `_certificateDataHash`: `"REG-2024-CSE-8921"`
* **Output:**
  * Status: `0x1 (Success)`
  * Emitted Event: `CertificateIssued(id: 1, studentName: "Aarav Sharma", ...)`

#### 2. Test Case 2: Invalid Input Validation Revert
* **Method Executed:** `issueCertificate("", "B.Tech Computer Science", "REG-FAIL-TEST")`
* **Sender:** `0x5B38Da6a701c568545dCfcB03FcB875f56beddC4`
* **Output:**
  * Status: `0x0 (Transaction Reverted)`
  * Revert Reason: `Validation Error: Student name cannot be empty.`

#### 3. Test Case 3: Unauthorized Access Revert
* **Method Executed:** `issueCertificate("Test", "Test Degree", "HASH-01")`
* **Sender:** `0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2` (Account 2 - Non-Owner)
* **Output:**
  * Status: `0x0 (Transaction Reverted)`
  * Revert Reason: `Error: Unauthorized! Only the university authority can perform this action.`
