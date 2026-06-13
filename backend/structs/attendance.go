package structs

// AttendanceRequest untuk menampung data saat Karyawan melakukan absen (POST)
type AttendanceRequest struct {
    EmployeeID uint   `json:"employee_id" binding:"required"`
    Date       string `json:"date" binding:"required"`
    EntryTime  string `json:"entry_time" binding:"required"` 
    Status     string `json:"status" binding:"required"`
    EntryPhoto string `json:"entry_photo"`                   
}

// AttendanceResponse untuk format tabel Dashboard (GET)
type AttendanceResponse struct {
    ID         uint   `json:"id"`
    EmployeeID uint   `json:"employee_id"`   // <--- INI BARIS AJAIBNYA! (Dibutuhkan Karyawan)
    Date       string `json:"date"`
    DateLabel  string `json:"date_label"`    
    Name       string `json:"employee_name"` // (Dibutuhkan Admin)
    Outlet     string `json:"outlet_name"`   
    Entry      string `json:"entry_time"`    
    Exit       string `json:"exit_time"`     
    Status     string `json:"status"`
    EntryPhoto string `json:"entry_photo"`   
    ExitPhoto  string `json:"exit_photo"`    
}

type AttendanceUpdateRequest struct {
    ExitTime  string `json:"exit_time" binding:"required"`  
    ExitPhoto string `json:"exit_photo" binding:"required"` 
}