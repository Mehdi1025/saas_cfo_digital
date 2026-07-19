import { companyBrandColor } from '@/utils/company';

export default function CompanyBrandLogo({ company, className = '', size = 'md' }) {
    const color = companyBrandColor(company);
    const sizeClass = size === 'sm' ? 'h-9 w-9 rounded-lg' : 'h-11 w-11 rounded-xl';

    if (company?.logo_url) {
        return (
            <img
                src={company.logo_url}
                alt={company.name || 'Logo'}
                className={`${sizeClass} shrink-0 object-contain ${className}`}
            />
        );
    }

    return (
        <div
            className={`flex ${sizeClass} shrink-0 items-center justify-center shadow-md ${className}`}
            style={{ backgroundColor: color }}
        >
            <div className="h-5 w-5 rotate-45 border-2 border-white" aria-hidden />
        </div>
    );
}
