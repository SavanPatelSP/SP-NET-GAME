using UnityEngine;

public class BotController : MonoBehaviour
{
    public Combatant combatant;
    private Vector3 wanderTarget;
    private float thinkTimer;

    private void Awake()
    {
        combatant = GetComponent<Combatant>();
        combatant.controller = GetComponent<CharacterController>();
        PickNewTarget();
    }

    private void Update()
    {
        if (!combatant.alive) return;

        combatant.cooldown = Mathf.Max(0f, combatant.cooldown - Time.deltaTime);

        PlayerController player = GameBootstrap.Instance.Player;
        bool canSeePlayer = player != null && player.combatant.alive;
        float distToPlayer = canSeePlayer ? Vector3.Distance(transform.position, player.transform.position) : 999f;

        Vector3 moveDir = Vector3.zero;

        if (canSeePlayer && distToPlayer < GameBootstrap.Instance.BotAggroRange)
        {
            Vector3 dir = (player.transform.position - transform.position);
            dir.y = 0f;
            if (dir.sqrMagnitude > 0.001f) dir.Normalize();
            moveDir = dir;

            if (distToPlayer < GameBootstrap.Instance.BotAttackRange)
            {
                GameBootstrap.Instance.Fire(combatant, dir);
            }
        }
        else
        {
            thinkTimer -= Time.deltaTime;
            if (thinkTimer <= 0f || Vector3.Distance(transform.position, wanderTarget) < 2f)
            {
                PickNewTarget();
            }
            Vector3 dir = wanderTarget - transform.position;
            dir.y = 0f;
            if (dir.sqrMagnitude > 0.001f) dir.Normalize();
            moveDir = dir;
        }

        combatant.controller.Move(moveDir * combatant.speed * combatant.speedMult * Time.deltaTime);

        if (moveDir.sqrMagnitude > 0.1f)
        {
            transform.forward = moveDir;
        }
    }

    private void PickNewTarget()
    {
        float half = GameBootstrap.Instance.WorldSize * 0.5f;
        wanderTarget = new Vector3(Random.Range(-half, half), 0f, Random.Range(-half, half));
        thinkTimer = Random.Range(1.5f, 3.5f);
    }
}
