node {

  try {
    stage('Checkout') {
      checkout scm
    }

    stage('Build') {
      def myDocker = docker.build("fortnight-graph:v${env.BUILD_NUMBER}", '.')
      def nodeBuilder = docker.image("fortnight-graph:v${env.BUILD_NUMBER}")
    }
    stage('Test') {
      nodeBuilder.inside() {
        sh 'npm run test'
      }
    }
  } catch (e) {
    slackSend color: 'bad', channel: '#codebot', message: "Failed testing ${env.JOB_NAME} #${env.BUILD_NUMBER} (<${env.BUILD_URL}|View>)"
    process.exit(1)
  }

  if (!env.BRANCH_NAME.contains('PR-')) {
    try {
      docker.withRegistry('https://664537616798.dkr.ecr.us-east-1.amazonaws.com', 'ecr:us-east-1:aws-jenkins-login') {
        stage('Push Container') {
          myDocker.push("latest");
          myDocker.push("v${env.BUILD_NUMBER}");
        }
      }
      stage('Upgrade Container') {
        rancher confirm: true, credentialId: 'rancher', endpoint: 'https://rancher.as3.io/v2-beta', environmentId: '1a18', image: "664537616798.dkr.ecr.us-east-1.amazonaws.com/fortnight-graph:v${env.BUILD_NUMBER}", service: 'fortnight/graph', environments: '', ports: '', timeout: 30
      }
      stage('Notify Upgrade') {
        slackSend color: 'good', message: "Finished deploying ${env.JOB_NAME} #${env.BUILD_NUMBER} (<${env.BUILD_URL}|View>)"
      }
    } catch (e) {
      slackSend color: 'bad', message: "Failed deploying ${env.JOB_NAME} #${env.BUILD_NUMBER} (<${env.BUILD_URL}|View>)"
      process.exit(1)
    }
  }
}
