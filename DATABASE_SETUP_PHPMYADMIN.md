# Smart Patient — Database and Local Setup Guide

## 1. Database Configuration
The application is configured to connect to your local MySQL database:
- **Database Name**: `smart_patient_db`
- **Host**: `localhost:3306`
- **User**: `root`
- **Password**: *(blank by default in XAMPP)*

The complete database schema and demonstration data are stored in:
- `smart_patient_db.sql` (in the project root)

### Viewing in phpMyAdmin
1. Open your browser and navigate to:
   `http://localhost/phpmyadmin/`
2. In the left navigation sidebar, select **`smart_patient_db`**.
3. You will see all 16 tables:
   - `users` (credentials, BCrypt password hashes, roles: PATIENT, DOCTOR, ADMIN)
   - `patients` (patient profiles and unique patient codes PT-YYYY-XXXX)
   - `doctors` (verified medical specialists, hospitals, license numbers)
   - `hospitals` (regional hospital directory with addresses and contact numbers)
   - `appointments` (real appointments with doctor, hospital, date, time, and tokens)
   - `reports` (diagnostic and laboratory documents)
   - `report_values` (quantitative blood test investigations e.g. Haemoglobin, Platelets)
   - `prescriptions` (prescribed medicines, dosages, frequencies, food instructions)
   - `medicine_schedules` (daily dose checklists and taken status)
   - `follow_ups` (doctor review reminders and reasons)
   - `notifications` (welcome and appointment alerts)
   - `audit_logs` (security and compliance event tracking)

---

## 2. Opening in Apache NetBeans
1. Open **Apache NetBeans**.
2. Go to **File** &rarr; **Open Project...**
3. Select the **`backend`** folder (`c:\Users\hp\OneDrive\Desktop\SmartPatientFresh\backend`). NetBeans detects it as a standard Maven project.
4. Set Java platform to **JDK 21** in Project Properties &rarr; Sources / Libraries.
5. Right-click the project &rarr; **Run** or **Debug**.

---

## 3. Running the Frontend
From the `frontend` folder:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser. All requests to `/api` proxy seamlessly to the Spring Boot backend at `http://localhost:8080`.

---

## 4. Preconfigured Accounts for Demonstration
| Role | Email / Username | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Patient** | `deepak.biju@student.edu` | `Patient@123` | Patient ID: `PT-2026-0001` with existing appointments & lipid reports |
| **Doctor** | `dr.sharma@apollo.org` | `Doctor@123` | Verified Cardiologist at Apollo Speciality Hospital |
| **Admin** | `admin@smartpatient.edu` | `Admin@123` | Hospital System Administrator |

