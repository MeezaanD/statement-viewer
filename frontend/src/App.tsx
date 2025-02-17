import React, { useState, useEffect } from "react";
import axios from "axios";
import {
	MDBTable,
	MDBTableHead,
	MDBTableBody,
	MDBContainer,
	MDBRow,
	MDBCol,
	MDBBtn,
	MDBCard,
	MDBCardBody,
	MDBCardTitle,
	MDBCardText,
	MDBInput
} from "mdb-react-ui-kit";
import "./App.css";

const App = () => {
	const [file, setFile] = useState<File | null>(null);
	const [transactions, setTransactions] = useState<any[]>(() => {
		const savedTransactions = localStorage.getItem("transactions");
		return savedTransactions ? JSON.parse(savedTransactions) : [];
	});
	const [searchQuery, setSearchQuery] = useState<string>("");

	useEffect(() => {
		localStorage.setItem("transactions", JSON.stringify(transactions));
	}, [transactions]);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files) {
			setFile(event.target.files[0]);
		}
	};

	const handleUpload = async () => {
		if (!file) return alert("Please select a file first");

		const formData = new FormData();
		formData.append("file", file);

		try {
			const response = await axios.post("http://localhost:5000/upload", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			setTransactions(response.data.transactions);
		} catch (error) {
			console.error("Error uploading file:", error);
			alert("Failed to upload file");
		}
	};

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(event.target.value);
	};

	const handleClear = () => {
		setTransactions([]);
		localStorage.removeItem("transactions");
	};

	const filteredTransactions = transactions.filter(transaction =>
		transaction.Description.toLowerCase().includes(searchQuery.toLowerCase())
	);

	return (
		<MDBContainer className="container">
			<MDBRow className="justify-content-center">
				<MDBCol md="8">
					<MDBCard className="mt-4 shadow">
						<MDBCardBody>
							<MDBCardTitle className="text-center fw-bold">Bank Statement Reader</MDBCardTitle>
							<MDBCardText className="text-center">
								<input
									type="file"
									accept="application/pdf"
									onChange={handleFileChange}
									className="file-input text-center m-auto my-3"
								/>
								<MDBBtn onClick={handleUpload} className="upload-button ms-2">View Data</MDBBtn>
								<MDBBtn onClick={handleClear} className="clear-button ms-2 bg-danger">Clear Data</MDBBtn>
							</MDBCardText>
							<MDBInput
								label="Search Transactions"
								id="descriptionSearch"
								type="text"
								value={searchQuery}
								onChange={handleSearchChange}
								className="search-input"
							/>
						</MDBCardBody>
					</MDBCard>
					{filteredTransactions.length > 0 && (
						<MDBTable striped bordered hover align="middle" className="mt-4 table-custom">
							<MDBTableHead dark>
								<tr className="text-center">
									<th>Date</th>
									<th>Description</th>
									<th>Amount</th>
									<th>Balance</th>
								</tr>
							</MDBTableHead>
							<MDBTableBody>
								{filteredTransactions.map((transaction, index) => (
									<tr key={index}>
										<td className="text-center">{transaction.Date}</td>
										<td>{transaction.Description}</td>
										<td className={`text-end ${transaction.Amount < 0 ? "text-danger" : "text-success"}`}>
											{transaction.Amount.toFixed(2)}
										</td>
										<td className="text-end">{transaction.Balance.toFixed(2)}</td>
									</tr>
								))}
							</MDBTableBody>
						</MDBTable>
					)}
				</MDBCol>
			</MDBRow>
		</MDBContainer>
	);
};

export default App;
