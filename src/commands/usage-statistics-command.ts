import { VsCodeCommand } from "./vscode-command";

const STATISTICS_URL = 'https://sigrid-says.com/usage/matomo.php?idsite=5&rec=1&ca=1&e_c=vscode&e_a=';

export class UsageStatisticsCommand implements VsCodeCommand<UsageStatisticsPayload> {
    async execute(payload: UsageStatisticsPayload) {
        const { customer } = payload;
        try {
            if (!customer) {
                throw new Error("Customer identifier is required for usage statistics.");
            }
            
            const response = await fetch(STATISTICS_URL + customer, {method: 'GET'});
            if (!response.ok) {
                throw new Error(response.statusText);
            }
        } catch (error) {
            console.error("Failed to send usage statistics:", error);
            throw error;
        }
    }
}

interface UsageStatisticsPayload {
    customer: string;
}
