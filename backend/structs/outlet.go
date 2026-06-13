package structs

// OutletRequest untuk menampung data dari form Tambah & Edit
type OutletRequest struct {
	Name      string `json:"name" binding:"required"`
	Address   string `json:"addr" binding:"required"`
	Latitude  string `json:"lat" binding:"required"`
	Longitude string `json:"lng" binding:"required"`
	Radius    int    `json:"rad" binding:"required"`
}

// OutletResponse untuk format balikan data ke Frontend (GET)
type OutletResponse struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	Address   string `json:"addr"`
	Latitude  string `json:"lat"`
	Longitude string `json:"lng"`
	Radius    int    `json:"rad"`
}