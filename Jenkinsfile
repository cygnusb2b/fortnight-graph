node {
  def nodeBuilder = docker.image("limit0/node-build:latest")
  docker.withRegistry('https://registry.hub.docker.com', 'docker-registry-login') {
    nodeBuilder.pull()
  }

  try {
    stage('Checkout') {
      checkout scm
    }
    stage('Yarn') {
      nodeBuilder.inside("-v ${env.WORKSPACE}:/var/www/html -u 0:0") {
        sh 'yarn'
      }
    }
    stage('Test') {
      nodeBuilder.inside("-v ${env.WORKSPACE}:/var/www/html -u 0:0") {
        sh 'npm run test'
      }
    }
  } catch (e) {
    slackSend color: 'bad', channel: '#codebot', message: "Failed testing ${env.JOB_NAME} #${env.BUILD_NUMBER} (<${env.BUILD_URL}|View>)"
    process.exit(1)
  }

  // try {
  //   nodeBuilder.inside("-v ${env.WORKSPACE}:/var/www/html -u 0:0") {
  //     stage('Ember') {
  //       sh 'ember build --environment=production'
  //     }
  //     stage('Cleanup') {
  //       sh 'rm -rf node_modules bower_components tmp'
  //     }
  //   }

  // } catch (e) {
  //   slackSend color: 'bad', message: "Failed building ${env.JOB_NAME} #${env.BUILD_NUMBER} (<${env.BUILD_URL}|View>)"
  //   process.exit(1)
  // }

  if (!env.BRANCH_NAME.contains('PR-')) {
    try {
      docker.withRegistry('https://664537616798.dkr.ecr.us-east-1.amazonaws.com', 'ecr:us-east-1:aws-jenkins-login') {
        stage('Build Container') {
          myDocker = docker.build("fortnight-graph:v${env.BUILD_NUMBER}", '.')
        }
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
