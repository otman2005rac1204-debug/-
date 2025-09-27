import { GoogleGenAI } from "@google/genai";
import { CodeProject, CodeFile } from '../types';

const validateProjectData = (projectData: any): projectData is Omit<CodeProject, 'id' | 'originalPrompt'> => {
    return (
      projectData &&
      typeof projectData.projectName === 'string' &&
      typeof projectData.description === 'string' &&
      typeof projectData.language === 'string' &&
      Array.isArray(projectData.files) &&
      projectData.files.every(
        (file: any): file is CodeFile =>
          typeof file.fileName === 'string' && typeof file.code === 'string'
      )
    );
}

/**
 * Strips markdown code fences from a string and trims it.
 * @param text The raw text response from the AI.
 * @returns Cleaned text, ready for JSON parsing.
 */
const cleanJsonString = (text: string): string => {
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7, jsonText.length - 3).trim();
    } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.substring(3, jsonText.length - 3).trim();
    }
    return jsonText;
}

const cleanYamlString = (text: string): string => {
    let yamlText = text.trim();
    if (yamlText.startsWith('```yaml')) {
        yamlText = yamlText.substring(7, yamlText.length - 3).trim();
    } else if (yamlText.startsWith('```')) {
        yamlText = yamlText.substring(3, yamlText.length - 3).trim();
    }
    return yamlText;
}


/**
 * Generates project code using the Gemini API based on user input.
 * @param userInput The user's description of the project idea.
 * @param projectType The programming language, framework, or stack to use.
 * @param apiKey The user's Gemini API key.
 * @returns A promise that resolves to a project structure without an ID.
 */
export const generateProjectCode = async (userInput: string, projectType: string, apiKey: string): Promise<Omit<CodeProject, 'id' | 'originalPrompt'>> => {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are an expert full-stack software developer specializing in the following stack: ${projectType}.
Create a complete, multi-file project based on the user's request.

**API Integration Rules:**
The user may request to use a specific public API. Here is a list of common free APIs for your reference:

**General Purpose APIs:**
- JSONPlaceholder: Fake REST API for testing and prototyping.
- OpenWeatherMap: Provides weather data. Requires a free API key.
- The Movie DB (TMDb): Provides movie and TV show data. Requires a free API key.
- PokéAPI: Provides data about Pokémon.
- GIPHY API: Provides access to a library of GIFs. Requires a free API key.
- NewsAPI: Provides news articles from various sources. Requires a free API key.
- Unsplash API: Provides access to a library of high-quality photos. Requires a free API key.
- JokeAPI: A simple API for jokes.
- ExchangeRate-API: Provides currency exchange rate data. Requires a free API key.
- Quotable: Provides random famous quotes.

**Design & Art APIs:**
- Améthyste: Image manipulation and generation.
- Art Institute of Chicago: Access to their collection data.
- Colormind: Color scheme generator.
- ColourLovers: Colors, palettes, and patterns.
- Cooper Hewitt: Smithsonian Design Museum collection data.
- Dribbble: Access designers' work.
- EmojiHub: Get emojis.
- Europeana: European cultural heritage content.
- Harvard Art Museums: Access to their collection data.
- Icon Horse: Get website favicons.
- Iconfinder: Search millions of icons.
- Icons8: Access their icon library.
- Lordicon: Animated icons.
- Metropolitan Museum of Art: Access to their collection data.
- Noun Project: Icons for everything.
- PHP-Noise: Procedural noise image generation.
- Pixel Encounter: Random pixel art sprite generator.
- Rijksmuseum: Access to the Dutch national museum's collection.
- Word Cloud: API to create word cloud images.
- xColors: Get color palettes.

**Anime & Manga APIs (many are free, some require keys):**
- AniAPI: Advanced Anime API with torrents, schedules, etc.
- AniDB: Comprehensive anime database API.
- AnimeChan: Random anime quotes.
- Anime Facts: Random anime facts.
- Anime News Network: Encyclopedia of anime and manga.
- Catboy: API for catboy images.
- Danbooru Anime: Anime art image board API.
- Jikan: Unofficial MyAnimeList API.
- Kitsu: Modern anime/manga discovery platform API.
- MangaDex: Extensive manga API.
- MyAnimeList (official): Official API for MAL.
- Nekos.Best: High quality anime images and GIFs.
- Shikimori: API for Russian anime tracking site.
- Studio Ghibli: API for Ghibli films data.
- Trace.moe: Trace anime source from screenshot.
- Waifu.im: Anime image API.
- Waifu.pics: High-quality SFW/NSFW anime images & GIFs.

**Storage & Files APIs:**
- AnonFiles: Anonymous file sharing.
- BayFiles: File sharing with generous limits.
- Box: Secure content management and file sharing.
- ddownload: File hosting service.
- Dropbox: File sync and sharing.
- File.io: Ephemeral file sharing.
- Filestack: File uploading, transformation, and delivery.
- GoFile: Free and unlimited file sharing.
- Google Drive: Access and manage files in Google Drive.
- Gyazo: Instant screenshot and GIF uploads.
- Imgbb: Free image hosting.
- OneDrive: Access and manage files in Microsoft OneDrive.
- Pantry: Simple JSON data storage.
- Pastebin: Create and share text snippets.
- Pinata: IPFS pinning service for decentralized storage.
- Quip: Access documents and conversations.
- Storj: Decentralized cloud storage.
- The Null Pointer: Simple, temporary file hosting.
- Web3 Storage: Free decentralized storage on IPFS.

If the user's request mentions one of these APIs or a feature that clearly implies one (e.g., "weather app," "color palette generator," "random anime quote"), you MUST integrate it.
When integrating an API:
1.  Write the necessary client-side code (e.g., using 'fetch' or Python's 'requests' library) to call the API and display the data.
2.  If the API requires a key, use a placeholder constant like 'YOUR_API_KEY_HERE' in the code.
3.  In the 'README.md' file, you MUST add a section that:
    - States which API was used.
    - Provides a direct link to the API's documentation/signup page.
    - Clearly explains that the user needs to get their own free API key and where to place it in the code.

The file structure should be logical. Use folder paths in the 'fileName' property for files that are not in the root (e.g., 'frontend/src/App.jsx' or 'backend/server.js').

**README.md Rules:**
Crucially, you MUST include a 'README.md' file at the root level. This file must contain:
1.  A brief explanation of the project architecture.
2.  A "Project Breakdown" or "Features" section. In this section, list the key functionalities as distinct tasks or features. For each one, provide a description that helps the user understand its purpose and how it contributes to the overall project goal.
3.  Clear, simple instructions on how to set up and run the different parts of the project.
4.  If an API is used, the section detailing its setup as described in the "API Integration Rules".


**Project Setup & Execution Rules:**
If the project type ("${projectType}") is anything other than 'HTML/CSS/JS', you MUST provide a 'run.bat' file for Windows users to automate setup and execution.

1.  **For Python Projects:**
    - You MUST generate a \`requirements.txt\` file. It must include \`pytest\` for testing, in addition to any other required libraries (like 'requests' or 'flask'). If no other libraries are needed, it should still contain \`pytest\`.
    - You MUST create a \`tests\` directory with a test file (e.g., \`test_app.py\`) containing at least one meaningful \`pytest\` test case that validates the core functionality.
    - You MUST generate a \`Dockerfile\`. It must use a slim Python base image, copy files, install dependencies from \`requirements.txt\`, and set the CMD to run the main script. If it is a web application (e.g., using Flask), you MUST add an \`EXPOSE 5000\` instruction. Example:
      \`\`\`Dockerfile
      FROM python:3.9-slim
      WORKDIR /app
      COPY requirements.txt .
      RUN pip install --no-cache-dir -r requirements.txt
      COPY . .
      EXPOSE 5000
      CMD ["python", "app.py"]
      \`\`\`
    - The \`run.bat\` file MUST be configured to build and run the project using Docker. It should not use local virtual environments. It must build the image, run the tests in a separate container, and if they pass, run the main application container. Replace \`your-project-name\` with a lowercase, hyphenated version of the project's name.
      \`\`\`bat
      @echo off
      set "DOCKER_IMAGE_NAME=your-project-name"

      echo Building the Docker image: %DOCKER_IMAGE_NAME%
      docker build -t %DOCKER_IMAGE_NAME% .

      if %errorlevel% neq 0 (
          echo.
          echo Docker build failed. Please ensure Docker is running.
          pause
          exit /b
      )

      echo.
      echo Running the test suite...
      docker run --rm %DOCKER_IMAGE_NAME% pytest
      
      if %errorlevel% neq 0 (
          echo.
          echo Tests failed. The application will not be started.
          pause
          exit /b
      )

      echo.
      echo Tests passed! Running the application inside a Docker container.
      echo Access the app at http://localhost:5000 (if it is a web server).
      echo Press Ctrl+C to stop the container.
      docker run --rm -it -p 5000:5000 %DOCKER_IMAGE_NAME%

      pause
      \`\`\`

2.  **For Node.js, React, or Vue Projects:**
    - For single server/app projects (like Node.js or React), the \`run.bat\` should run 'npm install' and then a start command (e.g., 'npm run dev' or 'node server.js').
    - For full-stack projects (like React + Node.js), it must open two separate command prompts to run the frontend and backend concurrently. Use the 'start' command for this (e.g., 'start cmd /k "cd frontend && npm install && npm run dev"').
    - Add comments within the batch file to explain each step.

User's request: "${userInput}"

Your response must be a single JSON object. Ensure the 'language' field in the JSON is set to "${projectType}". The JSON object must match this structure:
{
  "projectName": "string",
  "description": "string",
  "language": "string",
  "files": [
    {
      "fileName": "string",
      "code": "string"
    }
  ]
}
Do not include any markdown formatting like \`\`\`json or any other explanatory text. Your entire response must be only the raw JSON object.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
      },
    });
    
    const jsonText = cleanJsonString(response.text);
    const projectData = JSON.parse(jsonText);

    if (!validateProjectData(projectData)) {
      console.error('Invalid data structure received from Gemini:', projectData);
      throw new Error('Received malformed data from the AI.');
    }

    return projectData;
  } catch (error) {
    console.error('Error generating project code with Gemini:', error);
    throw new Error('Failed to generate project code. Please try again.');
  }
};

/**
 * Refines an existing project's code based on user feedback.
 * @param originalIdea The initial user prompt for the project.
 * @param currentProjectData The current state of the project's data (name, description, files).
 * @param refinementRequest The user's instruction for what to change.
 * @param language The project's programming language or stack.
 * @param apiKey The user's Gemini API key.
 * @returns A promise that resolves to a new project structure.
 */
export const refineProjectCode = async (
  originalIdea: string,
  currentProjectData: Omit<CodeProject, 'id' | 'originalPrompt'>,
  refinementRequest: string,
  language: string,
  apiKey: string
): Promise<Omit<CodeProject, 'id' | 'originalPrompt'>> => {
  const ai = new GoogleGenAI({ apiKey });
  const currentFilesString = JSON.stringify(currentProjectData.files, null, 2);

  const prompt = `You are an expert software developer specializing in ${language}. You are tasked with refining an existing project.

**API Integration Rules for Refinement:**
The user's refinement request may involve adding or changing functionality that uses a public API. Refer to this list of common free APIs:

**General Purpose APIs:**
- JSONPlaceholder, OpenWeatherMap, The Movie DB (TMDb), PokéAPI, GIPHY API, NewsAPI, Unsplash API, JokeAPI, ExchangeRate-API, Quotable.

**Design & Art APIs:**
- Améthyste, Art Institute of Chicago, Colormind, ColourLovers, Cooper Hewitt, Dribbble, EmojiHub, Europeana, Harvard Art Museums, Icon Horse, Iconfinder, Icons8, Lordicon, Metropolitan Museum of Art, Noun Project, PHP-Noise, Pixel Encounter, Rijksmuseum, Word Cloud, xColors.

**Anime & Manga APIs:**
- AniAPI, AniDB, AnimeChan, Anime Facts, Anime News Network, Catboy, Danbooru Anime, Jikan, Kitsu, MangaDex, MyAnimeList (official), Nekos.Best, Shikimori, Studio Ghibli, Trace.moe, Waifu.im, Waifu.pics.

**Storage & Files APIs:**
- AnonFiles, BayFiles, Box, ddownload, Dropbox, File.io, Filestack, GoFile, Google Drive, Gyazo, Imgbb, OneDrive, Pantry, Pastebin, Pinata, Quip, Storj, The Null Pointer, Web3 Storage.

If the refinement request asks to integrate one of these APIs or a related feature:
1.  Modify the project files to add the necessary client-side code (e.g., 'fetch' calls or Python 'requests').
2.  If the API requires a key, use a placeholder constant like 'YOUR_API_KEY_HERE' in the code.

The user's original idea was: "${originalIdea}"
The project is built with the following stack: ${language}.

Here is the current code for the project, including file paths:
${currentFilesString}

The user wants to make the following change: "${refinementRequest}"

Please generate the complete, updated code for all necessary files based on this refinement request.
Maintain the existing file structure unless the request implies a change. The project should remain self-contained and functional.

**Refinement Rules:**
- You MUST update the 'README.md' file. This includes:
    - Updating API information if a new API is added or an existing one is changed. Include the API name, a link to its documentation, and clear instructions for the user.
    - Updating the "Project Breakdown" or "Features" section to reflect the changes made. If you add a new feature, add it to the list with a description. If you modify an existing feature, update its description accordingly.
- For Python projects:
    - If your changes require any new external libraries, you MUST update the \`requirements.txt\` file.
    - You MUST update the test cases in the \`tests\` directory to reflect the changes made to the application logic. Add new tests for new features and modify existing tests for changed features. Ensure the tests are meaningful and use the \`pytest\` framework.
    - If a \`Dockerfile\` exists, you MUST update it if the changes require it (e.g., changing the entrypoint script name, adding system-level dependencies, or exposing a new port).
    - Update the \`run.bat\` file if the project's name or exposed port changes.
- If a \`run.bat\` file exists (for non-Python projects), update it if the refinement changes how the project is run (e.g., changing the main script name).
- If a \`run.bat\` does not exist and the project type is not 'HTML/CSS/JS', you must generate the appropriate \`run.bat\` file as described in the initial generation instructions (handle Python vs. Node.js projects correctly).

Provide your response as a single JSON object. Do not change the project name or description unless the refinement request specifically asks for it. Ensure the 'language' field is still set to "${language}". The JSON object must match this structure:
{
  "projectName": "string",
  "description": "string",
  "language": "string",
  "files": [
    {
      "fileName": "string",
      "code": "string"
    }
  ]
}
Do not include any markdown formatting like \`\`\`json or any other explanatory text. Your entire response must be only the raw JSON object.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
      },
    });

    const jsonText = cleanJsonString(response.text);
    const projectData = JSON.parse(jsonText);

    if (!validateProjectData(projectData)) {
      console.error('Invalid data structure received from Gemini during refinement:', projectData);
      throw new Error('Received malformed data from the AI during refinement.');
    }

    return projectData;

  } catch (error) {
    console.error('Error refining project code with Gemini:', error);
    throw new Error('Failed to refine project code. Please try again.');
  }
};

/**
 * Generates a GitHub Actions CI/CD workflow file for a given project.
 * @param project The project to generate the workflow for.
 * @param apiKey The user's Gemini API key.
 * @returns A promise that resolves to the YAML content of the workflow file.
 */
export const generateCiCdWorkflow = async (project: CodeProject, apiKey: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });
    const fileList = project.files.map(f => f.fileName).join(', ');

    let languageSpecificInstructions = '';

    if (project.language.toLowerCase().includes('python')) {
        languageSpecificInstructions = `
The project is a Python application. The workflow MUST perform the following steps:
1.  **Checkout Code**: Use \`actions/checkout@v4\`.
2.  **Set up Python**: Use \`actions/setup-python@v5\` with Python version 3.9.
3.  **Install Dependencies**: Run \`pip install -r requirements.txt\`.
4.  **Run Tests**: Execute the test suite using \`pytest\`.
5.  **Build Docker Image**: Use the existing \`Dockerfile\` to build a Docker image to verify its integrity. DO NOT push the image to a registry.
`;
    } else if (project.language.toLowerCase().includes('node') || project.language.toLowerCase().includes('react') || project.language.toLowerCase().includes('vue')) {
        languageSpecificInstructions = `
The project is a Node.js-based application. The workflow MUST perform the following steps:
1.  **Checkout Code**: Use \`actions/checkout@v4\`.
2.  **Set up Node.js**: Use \`actions/setup-node@v4\` with Node.js version 20.x.
3.  **Install Dependencies**: Run \`npm install\`.
4.  **Run Tests**: If a \`"test"\` script exists in \`package.json\`, run it with \`npm test\`.
5.  **Build Project**: If a \`"build"\` script exists in \`package.json\`, run it with \`npm run build\`.
`;
    } else { // Default for HTML/CSS/JS
        languageSpecificInstructions = `
The project is a simple HTML/CSS/JS application. The workflow can be basic. It MUST perform the following steps:
1.  **Checkout Code**: Use \`actions/checkout@v4\`.
2.  You can add a placeholder "Deploy" step with a simple echo command, suggesting future integration with GitHub Pages.
`;
    }

    const prompt = `You are a DevOps expert specializing in CI/CD pipelines. Your task is to generate a GitHub Actions workflow file named \`ci.yml\`.
The workflow should be triggered on every \`push\` to the \`main\` branch and also allow for manual dispatch (\`workflow_dispatch\`).
The jobs should run on \`ubuntu-latest\`.

The project is a "${project.language}" application. It contains the following files: ${fileList}.

${languageSpecificInstructions}

Your response must be ONLY the raw YAML content for the \`ci.yml\` file. Do not include any markdown formatting like \`\`\`yaml or any other explanatory text.
`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.0,
            },
        });

        return cleanYamlString(response.text);
    } catch (error) {
        console.error('Error generating CI/CD workflow with Gemini:', error);
        throw new Error('Failed to generate CI/CD workflow. Please try again.');
    }
};