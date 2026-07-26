const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
    return EMAIL_PATTERN.test(String(email).trim().toLowerCase());
}

export function passwordRequirements(password) {
    const value = String(password);

    return {
        minLength: value.length >= 8,
        hasLetter: /[a-zA-Z]/.test(value),
        hasNumber: /\d/.test(value),
    };
}

export function isPasswordStrong(password) {
    const requirements = passwordRequirements(password);

    return (
        requirements.minLength &&
        requirements.hasLetter &&
        requirements.hasNumber
    );
}

export function passwordsMatch(password, confirmation) {
    return String(password).length > 0 && password === confirmation;
}

export function validateRegistrationForm({ name, email, password, password_confirmation }) {
    const errors = {};

    if (!String(name).trim()) {
        errors.name = 'Le nom est obligatoire.';
    }

    if (!isValidEmail(email)) {
        errors.email = 'Veuillez saisir une adresse e-mail valide.';
    }

    if (!isPasswordStrong(password)) {
        errors.password =
            'Le mot de passe doit contenir au moins 8 caracteres, une lettre et un chiffre.';
    }

    if (!passwordsMatch(password, password_confirmation)) {
        errors.password_confirmation = 'Les mots de passe ne correspondent pas.';
    }

    return errors;
}

export function validatePasswordResetForm({ password, password_confirmation }) {
    const errors = {};

    if (!isPasswordStrong(password)) {
        errors.password =
            'Le mot de passe doit contenir au moins 8 caracteres, une lettre et un chiffre.';
    }

    if (!passwordsMatch(password, password_confirmation)) {
        errors.password_confirmation = 'Les mots de passe ne correspondent pas.';
    }

    return errors;
}
