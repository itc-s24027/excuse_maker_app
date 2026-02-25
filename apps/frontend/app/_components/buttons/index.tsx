import React from "react";
import styles from "./buttons.module.css";

interface ButtonProps {
  onClick?: (e?: React.MouseEvent<HTMLButtonElement> | React.PointerEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

/* Primary Button */
export const PrimaryButton = ({ onClick, disabled, children, className }: ButtonProps) => (
  <button onClick={onClick} disabled={disabled} className={`${styles.primaryButton} ${className || ""}`}>
    {children}
  </button>
);

/* Secondary Button */
export const SecondaryButton = ({ onClick, disabled, children, className }: ButtonProps) => (
  <button onClick={onClick} disabled={disabled} className={`${styles.secondaryButton} ${className || ""}`}>
    {children}
  </button>
);

/* Danger Button */
export const DangerButton = ({ onClick, disabled, children, className }: ButtonProps) => (
  <button onClick={onClick} disabled={disabled} className={`${styles.dangerButton} ${className || ""}`}>
    {children}
  </button>
);

/* Cancel Button */
export const CancelButton = ({ onClick, disabled, children, className }: ButtonProps) => (
  <button onClick={onClick} disabled={disabled} className={`${styles.cancelButton} ${className || ""}`}>
    {children}
  </button>
);

/* Submit Button */
export const SubmitButton = ({ onClick, disabled, children, className }: ButtonProps) => (
  <button onClick={onClick} disabled={disabled} className={`${styles.submitButton} ${className || ""}`}>
    {children}
  </button>
);

/* Send Button */
export const SendButton = ({ onClick, disabled, children, className }: ButtonProps) => (
  <button onClick={onClick} disabled={disabled} className={`${styles.sendButton} ${className || ""}`}>
    {children}
  </button>
);

/* Navigation Button */
export const NavButton = ({ onClick, disabled, children, className }: ButtonProps) => (
  <button onClick={onClick} disabled={disabled} className={`${styles.navButton} ${className || ""}`}>
    {children}
  </button>
);

/* Action Button */
export const ActionButton = ({ onClick, disabled, children, className }: ButtonProps) => (
  <button onClick={onClick} disabled={disabled} className={`${styles.actionButton} ${className || ""}`}>
    {children}
  </button>
);

/* Action Button with Success variant */
export const ActionButtonSuccess = ({ onClick, disabled, children, className }: ButtonProps) => (
  <button onClick={onClick} disabled={disabled} className={`${styles.actionButton} ${styles.actionButtonSuccess} ${className || ""}`}>
    {children}
  </button>
);

/* Action Button with Hide variant */
export const ActionButtonHide = ({ onClick, disabled, children, className }: ButtonProps) => (
  <button onClick={onClick} disabled={disabled} className={`${styles.actionButton} ${styles.actionButtonHide} ${className || ""}`}>
    {children}
  </button>
);

interface MenuButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

/* Menu Button */
export const MenuButton = ({ onClick, disabled, children, className }: MenuButtonProps) => (
  <button onClick={onClick} disabled={disabled} className={`${styles.menuButton} ${className || ""}`}>
    {children}
  </button>
);

/* Menu Option Button */
interface MenuOptionProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  isDelete?: boolean;
}

export const MenuOption = ({ onClick, disabled, children, className, isDelete }: MenuOptionProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`${styles.menuOption} ${isDelete ? styles.menuOptionDelete : ""} ${className || ""}`}
  >
    {children}
  </button>
);

/* Popup Button */
export const PopupButton = ({ onClick, disabled, children, className }: ButtonProps) => (
  <button onClick={onClick} disabled={disabled} className={`${styles.popupButton} ${className || ""}`}>
    {children}
  </button>
);

/* Dialog Button */
interface DialogButtonProps extends ButtonProps {
  variant?: "delete" | "cancel";
}

export const DialogButton = ({ onClick, disabled, children, className, variant = "cancel" }: DialogButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`${styles.dialogButton} ${variant === "delete" ? styles.dialogButtonDelete : styles.dialogButtonCancel} ${className || ""}`}
  >
    {children}
  </button>
);

/* Modal Button */
interface ModalButtonProps extends ButtonProps {
  variant?: "cancel" | "submit";
}

export const ModalButton = ({ onClick, disabled, children, className, variant = "cancel" }: ModalButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`${styles.modalButton} ${variant === "submit" ? styles.modalButtonSubmit : styles.modalButtonCancel} ${className || ""}`}
  >
    {children}
  </button>
);

/* Create Modal Button */
interface CreateModalButtonProps extends ButtonProps {
  variant?: "cancel" | "submit";
}

export const CreateModalButton = ({ onClick, disabled, children, className, variant = "cancel" }: CreateModalButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`${variant === "submit" ? styles.createModalButtonSubmit : styles.createModalButtonCancel} ${className || ""}`}
  >
    {children}
  </button>
);





