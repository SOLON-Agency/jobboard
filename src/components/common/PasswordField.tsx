"use client";

import React, { forwardRef, useState } from "react";
import {
  IconButton,
  InputAdornment,
  TextField,
  type TextFieldProps,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

export const PasswordField = forwardRef<HTMLDivElement, TextFieldProps>(
  function PasswordField({ InputProps, ...props }, ref) {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <TextField
        {...props}
        ref={ref}
        type={showPassword ? "text" : "password"}
        InputProps={{
          ...InputProps,
          endAdornment: (
            <>
              {InputProps?.endAdornment}
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
                  onClick={() => setShowPassword((visible) => !visible)}
                  onMouseDown={(event) => event.preventDefault()}
                  edge="end"
                  sx={{ minWidth: 44, minHeight: 44 }}
                >
                  {showPassword ? (
                    <VisibilityOffIcon fontSize="small" />
                  ) : (
                    <VisibilityIcon fontSize="small" />
                  )}
                </IconButton>
              </InputAdornment>
            </>
          ),
        }}
      />
    );
  },
);
