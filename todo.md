# Crypto Tax Tracker - Project TODO

## Core Features

### Database & Schema
- [x] Design and implement database schema for API credentials (encrypted storage)
- [x] Design and implement database schema for transactions (unified table)
- [x] Design and implement database schema for transaction annotations (descriptions, categories)
- [x] Create Drizzle migrations for all tables

### Backend - API Integration
- [x] Implement Coinbase API client to fetch transaction history
- [x] Implement Kraken API client to fetch ledger entries and trades
- [x] Create tRPC procedure to connect Coinbase account (store encrypted API keys)
- [x] Create tRPC procedure to connect Kraken account (store encrypted API keys)
- [x] Create tRPC procedure to fetch and sync transactions from Coinbase
- [x] Create tRPC procedure to fetch and sync transactions from Kraken
- [x] Create tRPC procedure to list all connected accounts
- [x] Create tRPC procedure to disconnect/remove an account
- [x] Implement transaction normalization (unified format across exchanges)
- [x] Implement multi-currency support and native amount handling

### Backend - Annotations & Export
- [x] Create tRPC procedure to add/update transaction annotation (description + category)
- [x] Create tRPC procedure to list all transactions with annotations
- [x] Create tRPC procedure to export transactions to CSV (with annotations)
- [x] Implement CSV generation with all transaction fields and user annotations

### Frontend - Dashboard & Account Management
- [x] Build dashboard layout with sidebar navigation
- [x] Create "Connected Accounts" page to view Coinbase and Kraken connections
- [x] Create "Add Account" modal/form for Coinbase API key entry
- [x] Create "Add Account" modal/form for Kraken API key entry
- [x] Implement account connection flow with validation
- [x] Implement account disconnection with confirmation
- [x] Show account balance and sync status

### Frontend - Transaction Management
- [x] Create unified transactions table with pagination/filtering
- [x] Display transaction columns: date, type, amount, currency, native amount, status
- [x] Implement inline editing for transaction descriptions
- [x] Implement inline editing for transaction categories
- [x] Create category dropdown with predefined options (or custom entry)
- [x] Show loading states during transaction sync
- [x] Implement refresh/sync button for manual transaction updates

### Frontend - Export & Reporting
- [x] Create "Export" button to download transactions as CSV
- [x] Implement filtering options before export (date range, account, category)
- [x] Show export progress/confirmation

### Security & Polish
- [x] Encrypt API credentials before storing in database
- [x] Fix transaction ownership verification bug in updateAnnotation procedure
- [x] Add error handling and user-friendly error messages
- [x] Add loading skeletons and spinners
- [ ] Test transaction sync with real API credentials
- [x] Verify CSV export includes all required fields

## Bugs Fixed
- [x] Fixed transaction ownership verification bug in updateAnnotation (was only checking first transaction)

## Completed Features
All core features have been implemented! The application is ready for testing and deployment.
