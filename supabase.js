
const SUPABASE_URL = "https://mkxaczfhfuappbwtqvsj.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_upFMvIlodOUZTSVa2cKt4w_2wWwTqv0";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
console.log("KOVA OS: Supabase inicializado!");

supabaseClient.auth.getSession().then(({ data, error }) => {
    if (error) {
        console.error("Erro Supabase:", error.message);
    } else {
        console.log("Conexão inicializada com sucesso!");
        console.log("Sessão:", data.session);
    }
});