
/* KOVA OS — Autenticação oficial Supabase
   Controle de acesso por perfil e permissões.
*/

(() => {
  const PERMISSIONS = {
    ADM: [
      "overview", "crm", "sales", "finance", "projects",
      "team", "reports", "insights", "notifications",
      "users", "settings"
    ],

    GERENTE: [
      "overview", "crm", "sales", "projects",
      "team", "reports", "insights", "notifications"
    ],

    COMERCIAL: [
      "overview", "crm", "sales", "notifications"
    ],

    FINANCEIRO: [
      "overview", "finance", "reports",
      "insights", "notifications"
    ],

    DESENVOLVEDOR: [
      "overview", "projects", "notifications"
    ]
  };

  let currentUser = null;

  function normalizeRole(role) {
    const value = String(role || "")
      .trim()
      .toUpperCase();

    const roles = {
      ADMIN: "ADM",
      ADMINISTRADOR: "ADM",
      ADM: "ADM",
      GERENTE: "GERENTE",
      COMERCIAL: "COMERCIAL",
      FINANCEIRO: "FINANCEIRO",
      DESENVOLVEDOR: "DESENVOLVEDOR"
    };

    return roles[value] || null;
  }

  async function getProfile(authUser) {
    const { data: profile, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();

    if (error) {
      throw new Error("Erro ao consultar perfil: " + error.message);
    }

    if (!profile) {
      throw new Error("Usuário autenticado, mas sem perfil autorizado.");
    }

    const role = normalizeRole(profile.role);

    if (!role) {
      throw new Error("Perfil sem uma função de acesso válida.");
    }

    currentUser = {
      id: authUser.id,
      email: authUser.email,
      username: profile.username || authUser.email,
      name: profile.name || profile.full_name || authUser.email,
      role
    };

    return currentUser;
  }

  async function login(identifier, password) {
    try {
      const email = String(identifier || "").trim();

      if (!email.includes("@")) {
        return {
          ok: false,
          message: "Informe seu e-mail cadastrado no Supabase."
        };
      }

      const { data, error } = await supabaseClient.auth
        .signInWithPassword({
          email,
          password
        });

      if (error) {
        return {
          ok: false,
          message: "E-mail ou senha incorretos."
        };
      }

      const user = await getProfile(data.user);

      return {
        ok: true,
        user
      };

    } catch (error) {
      await supabaseClient.auth.signOut();
      currentUser = null;

      return {
        ok: false,
        message: error.message
      };
    }
  }

  async function restore() {
    try {
      const { data, error } =
        await supabaseClient.auth.getSession();

      if (error || !data.session) {
        currentUser = null;
        return null;
      }

      return await getProfile(data.session.user);

    } catch (error) {
      console.error("Erro ao restaurar sessão:", error);

      await supabaseClient.auth.signOut();
      currentUser = null;

      return null;
    }
  }

  async function logout() {
    currentUser = null;

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error("Erro ao sair:", error.message);
    }
  }

  function canAccess(page) {
    return !!currentUser &&
      (PERMISSIONS[currentUser.role] || []).includes(page);
  }

  function getAllowedPages() {
    return currentUser
      ? [...(PERMISSIONS[currentUser.role] || [])]
      : [];
  }

  window.KOVAAuth = {
    login,
    restore,
    logout,
    canAccess,
    getAllowedPages,
    getCurrentUser: () => currentUser,
    getDemoAccounts: () => []
  };

})();
