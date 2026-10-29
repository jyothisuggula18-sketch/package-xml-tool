# Salesforce Package.xml Generator

A web utility that helps Salesforce developers create `package.xml` manifest files for metadata deployments, without writing them by hand.

**Live demo:** https://ef75d762.packagexml-generator.pages.dev/

<img width="952" height="418" alt="image" src="https://github.com/user-attachments/assets/bf9a4312-a7b3-42b2-ac3e-0aec76143fa6" />

## Why I built it

Writing a `package.xml` by hand means looking up metadata type names and typing each member in the right XML format. For me this took about 30 minutes per deployment. This tool cuts that down by letting you select the metadata and generate the file.

## What it does

- Lets you select the Salesforce metadata you want to deploy
- Generates a valid `package.xml` file
- Lets you copy or download the file
- Add or remove features to match what your tool really does

## How to use

1. Open the live demo: https://ef75d762.packagexml-generator.pages.dev/
2. Select the metadata types and components to include
3. Generate the file, then copy / download it
4. Use it with the Salesforce CLI, for example:

```bash
sf project deploy start --manifest package.xml
```

## Tech stack

[HTML, CSS, JavaScript, or whatever you used]

## Run it locally

```bash
git clone https://github.com/jyothisuggula18-sketch/package-xml-tool.git
cd package-xml-tool
[how to start it, e.g. open index.html in your browser]
```

## License

MIT. See the [LICENSE](LICENSE) file.

## Author

Sravana Jyothi Suggula | [LinkedIn](https://www.linkedin.com/in/sravana-jyothi-suggula-012074236)
