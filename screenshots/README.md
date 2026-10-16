# Evidence Screenshots Guide

The assignment instructions specify that your repository must contain screenshots for the following 6 stages:

| Filename | Stage to Screenshot | How to capture |
| :--- | :--- | :--- |
| `01_contract_compilation.png` | **Smart contract compilation** | In [Remix IDE](https://remix.ethereum.org), open the "Solidity Compiler" tab, compile `CertificateVerifier.sol`, and screenshot the screen with the green checkmark. |
| `02_contract_deployment.png` | **Smart contract deployment** | In Remix, deploy the contract to Ganache / Testnet, and screenshot the "Deployed Contracts" section at the bottom left showing the contract address. |
| `03_metamask_connection.png` | **MetaMask wallet connection** | In the frontend (`http://localhost:8000/frontend`), click "Connect MetaMask" and screenshot the connected wallet address and network badge. |
| `04_successful_transaction.png` | **Successful transaction** | In the frontend, fill student details and click "Issue Certificate". Screenshot the MetaMask confirmation popup or the green success message with transaction hash. |
| `05_failed_transaction.png` | **Failed transaction** | Click "Trigger Invalid Test" or switch to a non-owner account and click "Issue Certificate". Screenshot the transaction revert / error prompt. |
| `06_blockchain_data_display.png` | **Blockchain data displayed through UI** | In the "Credential Verification" section, enter Certificate ID `1` and click "Verify Data". Screenshot the authentic certificate card displayed on screen. |

Save your images directly into this `screenshots/` folder with the filenames above.
