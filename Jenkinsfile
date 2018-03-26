node {
  def nodeBuilder = docker.image("node:8")
  nodeBuilder.pull()

  try {
    stage('Checkout') {
      checkout scm
    }
    stage('Test') {
      try {
        sh 'yarn run coverage'
        junit 'coverage/test-results.xml'
        cobertura autoUpdateHealth: false, autoUpdateStability: false, coberturaReportFile: 'coverage/cobertura-coverage.xml', conditionalCoverageTargets: '70, 0, 0', failUnhealthy: false, failUnstable: false, lineCoverageTargets: '80, 0, 0', maxNumberOfBuilds: 0, methodCoverageTargets: '80, 0, 0', onlyStable: false, sourceEncoding: 'ASCII', zoomCoverageChart: false
      } catch (e) {
        junit 'coverage/test-results.xml'
        cobertura autoUpdateHealth: false, autoUpdateStability: false, coberturaReportFile: 'coverage/cobertura-coverage.xml', conditionalCoverageTargets: '70, 0, 0', failUnhealthy: false, failUnstable: false, lineCoverageTargets: '80, 0, 0', maxNumberOfBuilds: 0, methodCoverageTargets: '80, 0, 0', onlyStable: false, sourceEncoding: 'ASCII', zoomCoverageChart: false
        sh 'yarn run postcoverage'
        throw e
      }
    }
  } catch (e) {
    slackSend color: 'bad', channel: '#codebot', message: "Failed testing ${env.JOB_NAME} #${env.BUILD_NUMBER} (<${env.BUILD_URL}|View>)"
    throw e
  }

  if (env.BRANCH_NAME == 'master') {
    try {
      stage('Yarn Production Install') {
        nodeBuilder.inside("-v ${env.WORKSPACE}:/app -u 0:0") {
          sh 'yarn install --production'
        }
      }

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
        rancher confirm: true, credentialId: 'rancher', endpoint: 'https://rancher.as3.io/v2-beta', environmentId: '1a18', image: "664537616798.dkr.ecr.us-east-1.amazonaws.com/fortnight-graph:v${env.BUILD_NUMBER}", service: 'fortnight/graph', environments: '', ports: '', timeout: 180
      }
      stage('Notify Upgrade') {
        slackSend color: 'good', message: "Finished deploying ${env.JOB_NAME} #${env.BUILD_NUMBER} (<${env.BUILD_URL}|View>)"
      }
      stage('Notify NewRelic') {
        sh "curl -X POST 'https://api.newrelic.com/v2/applications/101523492/deployments.json' \
          -H 'X-Api-Key:7f58b04fa716469c1243e499c79ca89202b2ac355b0d092' -i \
          -H 'Content-Type: application/json' \
          -d '{ \"deployment\": { \"revision\": \"${env.BUILD_NUMBER}\", \"user\": \"jenkins\" } }'"
      }
      stage('Notify Sentry') {
        sh "curl https://sentry.as3.io/api/hooks/release/builtin/10/28030b8c0f65250244855e5b85483ad830692a84fc389727757bc2fac27f33e3/ \
          -X POST \
          -H 'Content-Type: application/json' \
          -d '{\"version\": \"${env.BUILD_NUMBER}\"}'"
      }
    } catch (e) {
      slackSend color: 'bad', message: "Failed deploying ${env.JOB_NAME} #${env.BUILD_NUMBER} (<${env.BUILD_URL}|View>)"
      throw e
    }
  }
}
