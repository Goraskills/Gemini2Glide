window.function = async function (apiKey, model, systemPrompt, userPrompt, outputFormat, jsonSchema) {
	// Assurez-vous d'avoir des valeurs pour les paramètres essentiels
	apiKey = apiKey.value ?? null;
	model = model.value ?? "gemini-1.5-flash"; // Modèle par défaut
	systemPrompt = systemPrompt.value ?? null;
	userPrompt = userPrompt.value ?? "Hello world";

	if (!apiKey) {
		return "Erreur: La clé API est manquante.";
	}

	const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

	// Construire le corps de la requête
	const requestBody = {
		contents: [
			{
				role: "user",
				parts: [{ text: userPrompt }],
			},
		],
	};

	// Ajouter le prompt du système s'il est fourni
	if (systemPrompt) {
		requestBody.system_instruction = {
			parts: [{ text: systemPrompt }],
		};
	}

	// Gérer les formats de sortie structurés
	if (outputFormat && outputFormat.value === "json" && jsonSchema) {
		requestBody.generationConfig = {
			responseMimeType: "application/json",
			responseSchema: JSON.parse(jsonSchema.value),
		};
	}

	try {
		// Appel à l'API de Gemini
		const response = await fetch(API_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			const errorData = await response.json();
			return `Erreur API: ${response.status} - ${errorData.error.message}`;
		}

		const data = await response.json();

		// Extraire le texte de la réponse
		const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

		if (!textContent) {
			return "Erreur: Aucune réponse textuelle trouvée.";
		}
		
		return textContent;

	} catch (e) {
		return `Une erreur s'est produite: ${e.message}`;
	}
};
