import 'server-only';

const API_URL = process.env.API_URL;

const backend = {
    getUser: async () => {
        const response = await fetch(`${API_URL}/api/v1/user`);
        return response.json();
    },
};
