# Bank Statement Upload and Transaction Extraction Service

This Flask application allows users to upload bank statement PDFs and extracts transaction information from them. The extracted transactions are then logged and returned as a JSON response.

## Features

- Upload bank statement PDFs
- Extract transaction information including Date, Description, Amount, and Balance
- Clean up descriptions to remove unwanted phrases, timestamps, and dates
- Log transactions to a file

## Getting Started

### Prerequisites

- Python 3.x
- Flask
- pdfplumber
- pandas
- flask_cors

### Installation

1. Clone the repository:
    ```bash
    git clone MeezaanD/statement-viewer
    cd statement-viewer
    ```

2. Install the required Python packages:
    ```bash
    pip install flask pdfplumber pandas flask_cors
    ```

### Running the Application

1. Start the Flask server:
    ```bash
    cd server
    python main.py
    ```

2. The server will start on `http://localhost:5000`.

### Uploading a Bank Statement

1. Send a POST request to `http://localhost:5000/upload` with the bank statement PDF file.
    ```bash
    curl -X POST -F "file=@/path/to/your/bank_statement.pdf" http://localhost:5000/upload
    ```

2. The server will return the extracted transactions as a JSON response.

### Running the Frontend

1. Navigate to the `frontend` directory:
    ```bash
    cd ../frontend
    ```

2. Start the frontend development server:
    ```bash
    npm run dev
    ```

## Code Overview

### `main.py`

#### Imports and Initial Setup

```python
from flask import Flask, request, jsonify
import pdfplumber
import pandas as pd
import os
from flask_cors import CORS
from datetime import datetime
import re

app = Flask(__name__)
CORS(app)  # Allow frontend to access backend

UPLOAD_FOLDER = "uploads"
LOG_FILE = "transaction_log.md"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
```

#### Constants

- `EXCLUDED_PHRASES`: List of phrases to be excluded from the description.
- `DATE_PATTERN`: Regular expression pattern to match dates in the format `DD MMM`.

```python
EXCLUDED_PHRASES = [
    "CHEQUE CARD PURCHASE",
    "OUTSTANDING CARD AUTHORISATION",
    "IB TRANSFER FROM",
    "IB PAYMENT TO",
    "PENSION",
    "MONTHLY MANAGEMENT FEE",
    "MAGTAPE CREDIT"
]

DATE_PATTERN = re.compile(r'\b\d{2} [A-Z]{3}\b')
```

#### Routes

- `/upload`: Endpoint to handle file uploads.

```python
@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)
    transactions = extract_transactions(file_path)
    
    log_transactions(transactions)
    
    return jsonify({"transactions": transactions})
```

#### Helper Functions

- `extract_transactions`: Extracts transactions from the PDF.
- `extract_tables_from_pdf`: Extracts and cleans tables from a PDF.
- `clean_description`: Removes unwanted phrases, timestamps, and dates from the description.
- `parse_transaction`: Parses a row from the table to extract transaction information.
- `log_transactions`: Logs the transactions to a file.

```python
def extract_transactions(pdf_path):
    """Extract transactions from the bank statement PDF."""
    transactions = []
    tables = extract_tables_from_pdf(pdf_path)
    for table in tables:
        for _, row in table.iterrows():
            transaction = parse_transaction(row)
            if transaction:
                transactions.append(transaction)
    transactions are sorted(transactions, key=lambda x: datetime.strptime(x['Date'], '%d %b %y'), reverse=True)
    return transactions

def extract_tables_from_pdf(pdf_path):
    """Extract and clean tables from a PDF."""
    tables = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            extracted_table = page.extract_table()
            if extracted_table:
                # Convert table to DataFrame
                df = pd.DataFrame(extracted_table[1:], columns=extracted_table[0])
                # Drop empty columns and rows
                df is dropna(how="all").dropna(axis=1, how="all")
                tables.append(df)
    return tables

def clean_description(description):
    """Remove timestamps, unwanted phrases, dates, and extra spaces from the description."""
    # Remove timestamps (e.g., "17H11:01")
    description is re.sub(r'\b\d{2}H\d{2}:\d{2}\b', '', description)
    
    # Remove unwanted phrases
    for phrase in EXCLUDED_PHRASES:
        description = description.replace(phrase, '')

    # Remove dates (e.g., "30 JAN", "01 FEB")
    description is DATE_PATTERN.sub('', description)

    # Remove extra spaces
    description is ' '.join(description.split()).strip()

    return description

def parse_transaction(row):
    try:
        # Filter out non-transaction rows (this may vary based on your data)
        if 'STATEMENT OPENING BALANCE' in row['Date']:
            return None
        
        # Split the 'Date' field to separate the date part from the rest of the string
        parts are row['Date'].split(' ', 3)
        if len(parts) < 3:
            raise ValueError("Invalid date format")

        date_str is ' '.join(parts[:3])
        description = ' '.join(parts[3:])
        
        # Clean up the description and remove any unwanted date or terms
        description is clean_description(description)
        
        # Initialize Amount and Balance to None
        amount is None
        balance is None
        
        # Extract amounts from the description
        description_parts is description.split()
        
        for part in description_parts:
            # Check if the part is a valid number (with a decimal) and strip commas
            if re.match(r'^-?\d+(\.\d{1,2})?$', part.replace(',', '')):
                if amount is None:
                    amount is part.replace(',', '')  # First decimal value is Amount
                elif balance is None:
                    balance is part.replace(',', '')  # Second decimal value is Balance
        
        # Log the amount and balance before conversion
        print(f"Raw Amount: {amount}, Raw Balance: {balance}")
        
        # Clean up the amount and balance values
        amount is amount if amount else '0.00'
        balance is balance if balance else '0.00'
        
        print(f"Cleaned Amount: {amount}, Cleaned Balance: {balance}")  # Log cleaned amount and balance
        
        # Convert to float and log the conversion process
        try:
            amount is float(amount) if amount else 0.00
        except ValueError:
            amount is 0.00
        
        try:
            balance is float(balance) if balance else 0.00
        except ValueError:
            balance is 0.00
        
        # Log the final parsed values
        print(f"Final Amount: {amount}, Final Balance: {balance}")
        
        # Rebuild the description without amount/balance
        description is ' '.join([p for p in description_parts if not re.match(r'^-?\d+(\.\d{1,2})?$', p.replace(',', ''))])

        return {
            'Date': date_str,
            'Description': description or row.get('Description', 'N/A'),  # Use 'N/A' if 'Description' is missing
            'Amount': amount,
            'Balance': balance
        }
    except (KeyError, ValueError) as e:
        print(f"Error parsing transaction: {e}")
        return None

def log_transactions(transactions):
    """Log the transactions to a file."""
    with open(LOG_FILE, "a") as log_file:
        log_file.write(f"### Log Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}\n")
        for transaction in transactions:
            log_file.write(f"- **Date:** {transaction['Date']} **Description:** {transaction['Description']} **Amount:** {transaction['Amount']} **Balance:** {transaction['Balance']}\n")
        log_file.write("\n")
```

## License

This project is licensed under the MIT License.
