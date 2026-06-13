package structs

type UserResponse struct {
	Id        uint    `json:"id"`
	Role      string  `json:"role"`
	CreatedAt string  `json:"created_at"`
	UpdatedAt string  `json:"updated_at"`
	Token     *string `json:"token,omitempty"`
}

type UserLoginRequest struct {
	UserID uint   `json:"user_id" binding:"required"`
	Pin    string `json:"pin" binding:"required,numeric,min=6"`
}