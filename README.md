# setup-titanium

This action sets up a AMPLIFY™ Titanium SDK environment for use in actions by
downloading and caching SDK by version and adding to titanium configuration file.

# Usage

See [action.yml](action.yml)

Basic:
```yaml
steps:
- uses: actions/checkout@latest
- uses: actions/setup-node@v1
  with:
    node-version: '12.x'
- run: npm install
- uses: drauggres/setup-titanium@v1 
  with:
    sdk-version: '8.2.0.GA'
- run: ti sdk select 8.2.0.GA
- run: ti build -p ios --build-only
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
