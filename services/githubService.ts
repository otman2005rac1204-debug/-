import { CodeProject } from '../types';

interface GitHubApiError {
  message: string;
  documentation_url: string;
}

const GITHUB_API_BASE = 'https://api.github.com';

async function githubApiRequest(url: string, token: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${GITHUB_API_BASE}${url}`, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28',
        },
    });

    if (!response.ok) {
        const errorData: GitHubApiError = await response.json();
        const errorMessage = `GitHub API Error: ${errorData.message} (Status: ${response.status})`;
        console.error(errorData);
        throw new Error(errorMessage);
    }
    
    // Some responses might be empty (e.g. 204 No Content)
    if (response.status === 204) {
        return null;
    }
    
    return response.json();
}

interface PublishToGitHubOptions {
    project: CodeProject;
    token: string;
    owner: string;
    repo: string;
    commitMessage: string;
    createNew: boolean;
    isPrivate: boolean;
}

export const publishToGitHub = async ({
    project,
    token,
    owner,
    repo,
    commitMessage,
    createNew,
    isPrivate,
}: PublishToGitHubOptions): Promise<string> => {

    const repoFullName = `${owner}/${repo}`;

    // Step 1: Create repository if requested
    if (createNew) {
        try {
            await githubApiRequest('/user/repos', token, {
                method: 'POST',
                body: JSON.stringify({
                    name: repo,
                    description: project.description,
                    private: isPrivate,
                }),
            });
        } catch (error: any) {
            // It's possible the repo already exists, which is not a fatal error if we're just pushing.
            if (!error.message.includes('name already exists')) {
                throw error;
            }
        }
    }

    // Step 2: Get the latest commit SHA and tree SHA from the main branch
    let latestCommitSha: string | null = null;
    let latestTreeSha: string | null = null;
    const mainBranch = 'main'; // Assuming 'main' branch

    try {
        const refData = await githubApiRequest(`/repos/${repoFullName}/git/ref/heads/${mainBranch}`, token);
        latestCommitSha = refData.object.sha;
        const commitData = await githubApiRequest(`/repos/${repoFullName}/git/commits/${latestCommitSha}`, token);
        latestTreeSha = commitData.tree.sha;
    } catch (error: any) {
        // If the ref doesn't exist, it's a new repository, which is fine.
        if (!error.message.includes('Not Found')) {
            throw error;
        }
    }
    
    // Step 3: Create the tree object with all project files
    const tree = project.files.map(file => ({
        path: file.fileName,
        mode: '100644', // file
        type: 'blob',
        content: file.code,
    }));

    const newTree = await githubApiRequest(`/repos/${repoFullName}/git/trees`, token, {
        method: 'POST',
        body: JSON.stringify({
            base_tree: latestTreeSha, // This works even if base_tree is null
            tree,
        }),
    });

    // Step 4: Create a new commit
    const newCommit = await githubApiRequest(`/repos/${repoFullName}/git/commits`, token, {
        method: 'POST',
        body: JSON.stringify({
            message: commitMessage,
            tree: newTree.sha,
            parents: latestCommitSha ? [latestCommitSha] : [],
        }),
    });

    // Step 5: Update the main branch reference to point to the new commit
    try {
        await githubApiRequest(`/repos/${repoFullName}/git/refs/heads/${mainBranch}`, token, {
            method: 'PATCH',
            body: JSON.stringify({
                sha: newCommit.sha,
            }),
        });
    } catch (error: any) {
         // If we are here, it means the ref didn't exist, so we create it
        if (error.message.includes('Not Found')) {
             await githubApiRequest(`/repos/${repoFullName}/git/refs`, token, {
                method: 'POST',
                body: JSON.stringify({
                    ref: `refs/heads/${mainBranch}`,
                    sha: newCommit.sha,
                }),
            });
        } else {
            throw error;
        }
    }

    return `https://github.com/${repoFullName}`;
};
