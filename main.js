import { goraniStore } from './libraries/goraniStore/src/goraniStore.js';
const xpathList = {
    cabinet : '/html/body/div[1]/div[1]/div[2]/div/div[3]/div',
    labeingTextInput : '/html/body/div[1]/div[1]/div[2]/div/div[3]/div/div[1]/div/div[2]/div[1]/div[2]/textarea',
};

const storeList = {
    user_id : {
        key : 'GRAND_FRERE_user_id',
        defaultValue : '',
        type : 'String',
    },
    is_enabled : {
        key : 'GRAND_FRERE_is_enabled',
        defaultValue : true,
        type : 'Boolean',
    },
}

export const main = () => {
    console.log('Main is running');

    let user_id = new goraniStore(storeList.user_id);
    let is_enabled = new goraniStore(storeList.is_enabled);

    let loader;

    // 백드롭
    const text = document.createElement('div');
    text.style.position = 'fixed';
    text.style.zIndex = '1000';
    text.style.top = '0';
    text.style.left = '0';
    text.style.width = '100vw';
    text.style.height = '100vh';
    text.style.display = 'flex';
    text.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    text.style.color = 'white';
    text.style.justifyContent = 'center';
    text.style.alignItems = 'center';
    text.style.fontSize = `32px`;
    text.textContent = '기록을 전송중입니다.';
    

    if(is_enabled.get()) {
        startLoader();
    }
    function startLoader() {
        
        loader = setInterval(async () => {
            console.log('a')
            // 기능 Off시 작동하지 않도록 함
            if (!is_enabled.get()) stopLoader();
            // 제출 후 채점하기 결과가 성공적으로 나왔다면 코드를 파싱하고, 업로드를 시작한다
            else if (getSolvedResult().includes('정답')) {
                stopLoader();
                try {
                    if(!user_id.get()) {
                        while(!user_id.get()) {
                            alert('백준 아이디가 설정되지 않았습니다. 설정 후 결과를 전송합니다.');
                        
                            const str = user_id.get();
                            const result = window.prompt('백준 아이디를 입력해주세요.', str);
                            if(result) {
                                user_id.set(result);
                                alert('백준 아이디가 설정되었습니다. : ' + result);
                            }
                        }
                    }
                    
                    document.querySelector('#modal-dialog > div > div').appendChild(text);
                    const { problem_id, problem_name, result_message, runtime, memory, language } = parseData();  
                    const req = {
                        submit_id : `${user_id.get()}_programmers_${problem_id}`,
                        boj_id : user_id.get(),
                        problem_id,
                        problem_name,
                        result : result_message,
                        memory : parseInt(parseFloat(memory.split(' ')) * 1024),
                        time : runtime.split(' ')[0],
                        language,
                        code_length : 0,
                        submitted_at : new Date().toISOString(),
                    }
                       
                    // const res = axios.get('https://naver.com')
                    const res = await postData(
                        'https://script.google.com/macros/s/AKfycbymzwCjYHjO5I-S1YbBUYq3PC5_UElo_s9hugsRBOr-bFxnne2kWqYElR0ocEOl4ayq7g/exec?task_type=add_data_from_programmers', 
                        req
                    );
                    console.log(res);
                    if(!res.status) {
                        throw new Error(res.data);
                    }

                    alert('잘 됐습니다 fecilitation')
                } catch (error) {
                    alert('미안한데 잘 안됐습니다. 콘솔창을 열어보세요. \n다시 시도하려면 프로그램을 비활성화 후 다시 활성화하세요.')
                    console.error(error);
                    alert(error);

                } finally {
                    text.remove();
                }
            }
        }, 2000);
    }

    function stopLoader() {
        clearInterval(loader);
    }

    function getSolvedResult() {
        const result = document.querySelector('div.modal-header > h4');
        if (result) return result.innerText;
        return '';
    }

    function postData(url, data) {
        //https://gist.github.com/sslotsky/198a827b79e0faa92608fc8ee30a29a1
        const res = fetch(url, {
          method: "POST",
          headers: {
            // "Content-Type": "application/json; charset=utf-8",
            "Origin": "https://school.programmers.co.kr",
          },
          body: JSON.stringify({form:data})
        }).then((response) => response.json());
        return res;
      }

    let isShift = false;
    const handleKeyup = (e) => {
        if (e.key === 'Shift') { isShift = false; }
    };
    const handleKeydown = (e) => {
        if (e.key === 'Shift') { isShift = true; }

        if (isShift) {
            if (e.key === 'a' || e.key === 'A') {
                is_enabled.set(!is_enabled.get());
                alert('기능이 ' + (is_enabled.get() ? '활성화' : '비활성화') + '되었습니다.');
                if(is_enabled.get()) {
                    startLoader();
                }  else {
                    stopLoader();
                }
            } else {
                if (e.key === 's' || e.key === 'S') {
                    const str = user_id.get();
                    const result = window.prompt('백준 아이디를 입력해주세요', str);
                    if(result) {
                        user_id.set(result);
                        alert('백준 아이디가 설정되었습니다. : ' + result);
                    }
                    
                }
            }

        }
    };
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('keyup', handleKeyup);

}


/*
  문제가 맞았다면 문제 관련 데이터를 파싱하는 함수의 모음입니다.
  모든 해당 파일의 모든 함수는 parseData()를 통해 호출됩니다.
*/

/*
  bojData를 초기화하는 함수로 문제 요약과 코드를 파싱합니다.
  - directory : 레포에 기록될 폴더명
  - message : 커밋 메시지
  - fileName : 파일명
  - readme : README.md에 작성할 내용
  - code : 소스코드 내용
*/
 function parseData() {
    const problem_id = document.querySelector('div.main > div.lesson-content').getAttribute('data-lesson-id');
    const problem_name = document.querySelector('.algorithm-title .challenge-title').textContent.replace(/\\n/g, '').trim();
    const result_message =
      [...document.querySelectorAll('#output .console-message')]
        .map((node) => node.textContent)
        .filter((text) => text.includes(':'))
        .reduce((cur, next) => (cur ? `${cur}<br/>${next}` : next), '') || 'Empty';
    const [runtime, memory] = [...document.querySelectorAll('td.result.passed')]
      .map((x) => x.innerText)
      .map((x) => x.replace(/[^., 0-9a-zA-Z]/g, '').trim())
      .map((x) => x.split(', '))
      .reduce((x, y) => (Number(x[0]) > Number(y[0]) ? x : y), ['0.00ms', '0.0MB'])
      .map((x) => x.replace(/(?<=[0-9])(?=[A-Za-z])/, ' '));
  
    /*프로그래밍 언어별 폴더 정리 옵션을 위한 언어 값 가져오기*/
    const language = document.querySelector('div#tour7 > button').textContent.trim();
  
    return { problem_id, problem_name, result_message, runtime, memory, language };
  }
  