// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertificateVerifier
 * @dev Decentralized Academic Credential Verification System
 * CSE4444 - Blockchain Technology Assignment 2
 */
contract CertificateVerifier {
    // State Variables
    address public owner;
    string public institutionName;
    uint256 public certificateCount;

    struct Certificate {
        uint256 id;
        string studentName;
        string courseName;
        string certificateDataHash;
        uint256 issueTimestamp;
        bool isValid;
    }

    // Mapping from Certificate ID to Certificate details
    mapping(uint256 => Certificate) public certificates;

    // Events for blockchain logging
    event CertificateIssued(
        uint256 indexed id,
        string studentName,
        string courseName,
        string certificateDataHash,
        uint256 issueTimestamp
    );
    event CertificateRevoked(uint256 indexed id, uint256 revokedTimestamp);

    // Access Control Modifier
    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Error: Unauthorized! Only the university authority can perform this action."
        );
        _;
    }

    /**
     * @dev Constructor to initialize institution details and set deployer as owner
     * @param _institutionName Name of the issuing educational institution
     */
    constructor(string memory _institutionName) {
        require(
            bytes(_institutionName).length > 0,
            "Validation Error: Institution name cannot be empty."
        );
        owner = msg.sender;
        institutionName = _institutionName;
        certificateCount = 0;
    }

    /**
     * @dev Issue a new tamper-proof academic certificate (Restricted to Owner)
     * @param _studentName Full name of the graduate/student
     * @param _courseName Degree or course title
     * @param _certificateDataHash Unique document reference hash / roll number
     */
    function issueCertificate(
        string memory _studentName,
        string memory _courseName,
        string memory _certificateDataHash
    ) public onlyOwner returns (uint256) {
        // Input Validations
        require(
            bytes(_studentName).length > 0,
            "Validation Error: Student name cannot be empty."
        );
        require(
            bytes(_courseName).length > 0,
            "Validation Error: Course name cannot be empty."
        );
        require(
            bytes(_certificateDataHash).length > 0,
            "Validation Error: Certificate reference hash cannot be empty."
        );

        certificateCount++;
        certificates[certificateCount] = Certificate({
            id: certificateCount,
            studentName: _studentName,
            courseName: _courseName,
            certificateDataHash: _certificateDataHash,
            issueTimestamp: block.timestamp,
            isValid: true
        });

        emit CertificateIssued(
            certificateCount,
            _studentName,
            _courseName,
            _certificateDataHash,
            block.timestamp
        );

        return certificateCount;
    }

    /**
     * @dev Revoke an existing certificate in case of fraud or academic misconduct (Restricted to Owner)
     * @param _id Unique Certificate ID
     */
    function revokeCertificate(uint256 _id) public onlyOwner {
        require(
            _id > 0 && _id <= certificateCount,
            "Validation Error: Certificate ID does not exist."
        );
        require(
            certificates[_id].isValid,
            "Validation Error: Certificate is already revoked or inactive."
        );

        certificates[_id].isValid = false;
        emit CertificateRevoked(_id, block.timestamp);
    }

    /**
     * @dev Public verification function to inspect certificate authenticity
     * @param _id Unique Certificate ID to verify
     */
    function verifyCertificate(uint256 _id)
        public
        view
        returns (
            uint256 id,
            string memory studentName,
            string memory courseName,
            string memory certificateDataHash,
            uint256 issueTimestamp,
            bool isValid
        )
    {
        require(
            _id > 0 && _id <= certificateCount,
            "Validation Error: Certificate not found for the provided ID."
        );

        Certificate memory cert = certificates[_id];
        return (
            cert.id,
            cert.studentName,
            cert.courseName,
            cert.certificateDataHash,
            cert.issueTimestamp,
            cert.isValid
        );
    }

    /**
     * @dev View function to get current authority status and total count
     */
    function getInstitutionSummary()
        public
        view
        returns (
            string memory _institutionName,
            address _owner,
            uint256 _totalCertificates
        )
    {
        return (institutionName, owner, certificateCount);
    }
}
