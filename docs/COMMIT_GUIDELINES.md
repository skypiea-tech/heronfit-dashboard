# Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for our commit messages. This helps us create an explicit commit history, which makes it easier to write automated tools over the history, and makes it easier for contributors to contribute to the project.

Commit messages should be structured as follows:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Structure Explained:

1.  **type**: A mandatory type to describe the kind of change this commit is providing. Common types include:

    - `feat`: A new feature
    - `fix`: A bug fix
    - `docs`: Documentation only changes
    - `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc.)
    - `refactor`: A code change that neither fixes a bug nor adds a feature
    - `perf`: A code change that improves performance
    - `test`: Adding missing tests or correcting existing tests
    - `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation
    - `build`: Changes that affect the build system or external dependencies
    - `ci`: Changes to our CI configuration files and scripts
    - `revert`: Reverts a previous commit

2.  **scope** (optional): A scope can be provided to specify the part of the codebase affected by the commit. It should be a noun, enclosed in parentheses, e.g., `(parser)`, `(api)`, `(auth)`. If the change is to more than one scope, you can use `*` or leave it empty.

3.  **description**: A mandatory, concise description of the change. Use the imperative mood (e.g., "change", "add", "fix"). Do not capitalize the first letter. No period at the end.

4.  **body** (optional): A longer body can be provided to give additional context about the change. It should start one blank line after the description.

5.  **footer(s)** (optional): The footer can contain information about Breaking Changes and closed issues. Breaking Changes should start with `BREAKING CHANGE:` followed by a description.

## Examples:

```
feat(api): add new endpoint for user registration
```

```
fix(auth): resolve issue with token expiration

The previous implementation incorrectly calculated token validity.
This fix ensures tokens expire correctly based on the configured TTL.
```

```
refactor: streamline build process

BREAKING CHANGE: The build command has been updated.
See the README for new instructions.
```

```
docs: update installation instructions

Closes #123
```

By adhering to these guidelines, we maintain a clean and informative commit history. As your AI assistant, I will also strive to follow these standards when generating commit messages for changes I propose.
