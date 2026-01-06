# Claude Code Safety Net - Attribution

This safety net implementation is derived from **[Claude Code Safety Net](https://github.com/kenryu42/claude-code-safety-net)** by [kenryu42](https://github.com/kenryu42).

## License

MIT License - Copyright (c) 2025 kenryu42

See [LICENSE](./LICENSE) for the full license text.

## Original Project

The Claude Code Safety Net plugin provides protection against destructive commands when using Claude Code, including:

- Git destructive operations (`git reset --hard`, `git push --force`, etc.)
- Dangerous file deletions (`rm -rf` outside cwd)
- Dynamic execution risks

For the latest version, updates, and to contribute, visit the [original repository](https://github.com/kenryu42/claude-code-safety-net).
