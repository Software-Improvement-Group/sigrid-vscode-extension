const STATISTICS_URL = 'https://sigrid-says.com/usage/matomo.php?idsite=5&rec=1&ca=1&e_c=vscode&e_a=';

export function trackUsage(customer: string, eventName: string): void {
    if (!customer) {
        return;
    }

    fetch(STATISTICS_URL + encodeURIComponent(customer) + '&e_n=' + eventName, { method: 'GET' })
        .catch(err => console.error('Failed to send usage statistics:', err));
}
