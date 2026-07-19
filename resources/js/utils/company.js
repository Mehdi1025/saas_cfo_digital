export function companySenderLines(company) {
    if (!company) {
        return [];
    }

    const lines = [];

    if (company.address?.trim()) {
        lines.push(company.address.trim());
    }

    if (company.registration_number?.trim()) {
        lines.push(company.registration_number.trim());
    }

    if (company.email?.trim()) {
        lines.push(company.email.trim());
    }

    if (company.phone?.trim()) {
        lines.push(company.phone.trim());
    }

    return lines;
}

export function companyBrandColor(company, fallback = '#3B82F6') {
    return company?.brand_color || fallback;
}
