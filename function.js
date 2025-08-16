window.function = async function (
	apiKey,
	model,
	systemPrompt,
	userPrompt,
	temperature,
	maxOutputTokens,
	topP,
	topK,
	outputFormat,
	jsonSchema
) {
	// Assigner des valeurs par défaut pour les paramètres optionnels
	const key = apiKey.value ?? null;
	const modelName = model.value ?? "models/gemini-1.5-flash"; // Format de nom de modèle corrigé
	const userText = userPrompt.value ?? "Hello world";
	const sysPrompt = systemPrompt.value ?? null;
	const outFormat = outputFormat.value ?? "text";
	const schema = jsonSchema.value ?? null;
    
    // Définir l'URL du proxy Cloudflare que vous avez créé
    // REMPLACER cette URL par la vôtre
	const PROXY_URL = 'https://nom-de-votre-worker.votre-nom.workers.dev/';

	// Vérifier si une clé API est fournie avant de continuer
	if (!key) {
		return "Erreur: La clé API est manquante.";
	}
	
	// Construire l'objet 'generationConfig' pour les paramètres du modèle
	const generationConfig = {};
	if (temperature.value) {
		generationConfig.temperature = temperature.value;
	}
	if (maxOutputTokens.value) {
		generationConfig.maxOutputTokens = maxOutputTokens.value;
	}
	if (topP.value) {
		generationConfig.topP = topP.value;
	}
	if (topK.value) {
		generationConfig.topK = topK.value;
	}

	// Gérer les formats de sortie structurés
	if (outFormat === "json" && schema) {
		generationConfig.responseMimeType = "application/json";
		try {
			generationConfig.responseSchema = JSON.parse(schema);
		} catch (e) {
			return "Erreur: Le schéma JSON est invalide.";
		}
	}
    
    // Construire le corps de la requête finale à envoyer au proxy
    const requestBody = {
        // La clé API et le nom du modèle sont envoyés au proxy
        // pour qu'il construise l'URL correcte.
        apiKey: key, 
        model: modelName,
        contents: [
            {
                role: "user",
                parts: [{ text: userText }],
            },
        ],
        generationConfig: generationConfig,
    };
    
    if (sysPrompt) {
        requestBody.systemInstruction = {
            parts: [{ text: sysPrompt }],
        };
    }

	// Envoyer la requête au proxy
	try {
		const response = await fetch(PROXY_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(requestBody),
		});

		const data = await response.json();

		if (!response.ok) {
			const errorMessage = data?.error?.message || "Erreur inconnue";
			return `Erreur API: ${response.status} - ${errorMessage}`;
		}

		const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

		if (!textContent) {
			return "Erreur: Aucune réponse textuelle trouvée.";
		}

		return textContent;
	} catch (e) {
		return `Une erreur s'est produite: ${e.message}`;
	}
};
